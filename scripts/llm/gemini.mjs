function toGeminiSchema(schema) {
    if (!schema || typeof schema !== "object") {
        return schema;
    }

    const result = { ...schema };
    delete result.additionalProperties;
    delete result.$schema;

    if (result.properties && typeof result.properties === "object") {
        result.properties = Object.fromEntries(
            Object.entries(result.properties).map(([key, value]) => [
                key,
                toGeminiSchema(value)
            ])
        );
    }

    if (Array.isArray(result.items)) {
        result.items = result.items.map(toGeminiSchema);
    } else if (result.items) {
        result.items = toGeminiSchema(result.items);
    }

    if (Array.isArray(result.anyOf)) {
        result.anyOf = result.anyOf.map(toGeminiSchema);
    }

    if (Array.isArray(result.oneOf)) {
        result.oneOf = result.oneOf.map(toGeminiSchema);
    }

    return result;
}

function toGeminiFunctionDeclarations(tools) {
    return tools
        .filter(tool => tool.type === "function")
        .map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: toGeminiSchema(tool.parameters)
        }));
}

function toGeminiContents(input) {
    return input.flatMap(item => {
        if (item.role === "user" && typeof item.content === "string") {
            return [{
                role: "user",
                parts: [{ text: item.content }]
            }];
        }

        if (item.type === "function_call") {
            return [{
                role: "model",
                parts: [{
                    functionCall: {
                        name: item.name,
                        args: JSON.parse(item.arguments ?? "{}")
                    },
                    ...(item.thought_signature
                        ? { thoughtSignature: item.thought_signature }
                        : {})
                }]
            }];
        }

        if (item.type === "function_call_output") {
            return [{
                role: "user",
                parts: [{
                    functionResponse: {
                        name: item.name ?? "tool",
                        response: {
                            result: JSON.parse(item.output ?? "null")
                        }
                    }
                }]
            }];
        }

        return [];
    });
}

export async function callGemini({ apiKey, model, input, tools }) {
    const functionDeclarations = toGeminiFunctionDeclarations(tools);
    const contents = toGeminiContents(input);

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents,
                tools: functionDeclarations.length > 0
                    ? [{ functionDeclarations }]
                    : undefined
            })
        }
    );

    const body = await response.text();

    if (!response.ok) {
        throw new Error(`Gemini API ${response.status}: ${body}`);
    }

    const data = JSON.parse(body);
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts.filter(part => part.functionCall);

    return {
        output: functionCalls.map(part => ({
            type: "function_call",
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args ?? {}),
            call_id: part.functionCall.name,
            ...(part.thoughtSignature
                ? { thought_signature: part.thoughtSignature }
                : {})
        })),
        output_text: parts
            .filter(part => typeof part.text === "string")
            .map(part => part.text)
            .join("\n")
    };
}
