export async function callOpenAI({ apiKey, model, input, tools }) {
    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            input,
            tools,
            tool_choice: "auto",
            parallel_tool_calls: false
        })
    });

    const body = await response.text();

    if (!response.ok) {
        throw new Error(`OpenAI API ${response.status}: ${body}`);
    }

    return JSON.parse(body);
}
