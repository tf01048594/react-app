let geminiHistory = null;

function toGeminiSchema(schema) {
    if (!schema || typeof schema !== "object") return schema;

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

    if (result.items) {
        result.items = Array.isArray(result.items)
            ? result.items.map(toGeminiSchema)
            : toGeminiSchema(result.items);
    }

    if (Array.isArray(result.anyOf)) {
        result.anyOf = result.anyOf.map(toGeminiSchema);
    }

    if (Array.isArray(result.oneOf)) {
        result.oneOf = result.oneOf.map(toGeminiSchema);
    }

    return result;
}

function toGeminiTools(tools) {
    return tools
        .filter(tool => tool.type === "function")
        .map(tool => ({
            type: "function",
            name: tool.name,
            description: tool.description,
            parameters: toGeminiSchema(tool.parameters)
        }));
}

function toInitialInput(input) {
    const firstUserMessage = input.find(
        item => item.role === "user" && typeof item.content === "string"
    );

    return [{
        type: "user_input",
        content: [{ type: "text", text: firstUserMessage?.content ?? "" }]
    }];
}

function toFunctionResults(input) {
    return input
        .filter(item => item.type === "function_call_output")
        .map(item => ({
            type: "function_result",
            name: item.name,
            call_id: item.call_id,
            result: [{
                type: "text",
                text: item.output ?? "{}"
            }]
        }));
}

export async function callGemini({ apiKey, model, input, tools }) {
    if (!geminiHistory) {
        geminiHistory = toInitialInput(input);
    }

    const functionResults = toFunctionResults(input);

    geminiHistory.push(...functionResults);

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
            method: "POST",
            headers: {
                "x-goog-api-key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                store: false,
                input: geminiHistory,
                tools: toGeminiTools(tools)
            })
        }
    );

    const body = await response.text();

    if (!response.ok) {
        throw new Error(`Gemini API ${response.status}: ${body}`);
    }

    const data = JSON.parse(body);
    const steps = data.steps ?? [];

    // Preserve Gemini's model-generated steps exactly as returned.
    // This is required for stateless function-calling history.
    geminiHistory.push(...steps);

    const functionCalls = steps.filter(step => step.type === "function_call");

    return {
        output: functionCalls.map(call => ({
            type: "function_call",
            name: call.name,
            arguments: JSON.stringify(call.arguments ?? {}),
            call_id: call.id
        })),
        output_text: data.output_text ?? ""
    };
}
