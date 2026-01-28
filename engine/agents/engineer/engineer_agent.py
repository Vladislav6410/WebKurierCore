from engine.llm import llm_router

async def engineer_handle(input_text: str) -> str:
    messages = [
        {"role": "system", "content": "You are WebKurier EngineerAgent. Output: code-first, minimal explanation."},
        {"role": "user", "content": input_text}
    ]
    result = await llm_router.chat(agent="engineer", task="default", messages=messages, temperature=0.1)
    return result["text"]

async def engineer_fast(input_text: str) -> str:
    messages = [
        {"role": "system", "content": "You are WebKurier EngineerAgent (fast mode). Short, actionable patches."},
        {"role": "user", "content": input_text}
    ]
    result = await llm_router.chat(agent="engineer", task="fast", messages=messages, temperature=0.1)
    return result["text"]