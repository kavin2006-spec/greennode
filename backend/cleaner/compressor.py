import os
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("../.env")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

SYSTEM_PROMPT = """You are a prompt compression specialist. Rewrite the given prompt to be maximally concise while preserving exact intent.

Rules:
- Strip ALL pleasantries: please, kindly, if you don't mind, help me understand, I was wondering, could you, would you, etc.
- Strip ALL filler: basically, actually, just, simply, very, really, quite, I would like you to, I need you to
- Keep every technical term, constraint, and specific requirement intact
- Output must be a direct instruction or question — no soft framing
- Return ONLY the rewritten prompt. No explanation, no quotes, no preamble."""

MODELS = [
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]

def compress_prompt(text: str) -> str:
    for model_id in MODELS:
        try:
            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {
                        "role": "user",
                        "content": f"""You are a prompt compressor. Convert verbose prompts into minimal direct instructions. Be aggressive — remove everything that isn't the core request.

Examples:
INPUT: I was wondering if you could please help me understand what neural networks are in simple terms if you don't mind?
OUTPUT: Explain neural networks simply.

INPUT: Could you please kindly explain what machine learning actually is in very simple terms?
OUTPUT: Explain machine learning simply.

INPUT: I would like you to very carefully summarize this document for me please if that is okay
OUTPUT: Summarize this document carefully.

INPUT: Can you help me by explaining the difference between REST and GraphQL APIs in a way that is easy to understand?
OUTPUT: Explain the difference between REST and GraphQL APIs simply.

INPUT: I was wondering if you could please help me by basically explaining in very simple terms what the difference actually is between supervised and unsupervised machine learning, if that is okay with you
OUTPUT: Explain the difference between supervised and unsupervised machine learning simply.

Now compress this. Return ONLY the compressed prompt, nothing else:
INPUT: {text}
OUTPUT:"""
                    }
                ],
                max_tokens=500,
                temperature=0.3,
            )
            compressed = response.choices[0].message.content.strip()
            if compressed.startswith('"') and compressed.endswith('"'):
                compressed = compressed[1:-1]
            return compressed
        except Exception as e:
            print(f"Model {model_id} failed: {e}")
            continue

    return _rule_based_fallback(text)

def _rule_based_fallback(text: str) -> str:
    FILLER_PHRASES = [
        r"\bplease\b", r"\bkindly\b", r"\bcould you\b", r"\bwould you\b",
        r"\bi was wondering if\b", r"\bi would like you to\b",
        r"\bif you don't mind\b", r"\bas an ai\b", r"\bas a language model\b",
        r"\bfeel free to\b", r"\bdon't hesitate to\b", r"\bi need you to\b",
        r"\bcan you please\b", r"\bi want you to\b", r"\bi'd like you to\b",
        r"\bbasically\b", r"\bactually\b", r"\bjust\b", r"\bsimply\b",
        r"\bvery\b", r"\breally\b", r"\bquite\b",
    ]
    compressed = text
    for phrase in FILLER_PHRASES:
        compressed = re.sub(phrase, "", compressed, flags=re.IGNORECASE)
    compressed = re.sub(r" +", " ", compressed).strip()
    if compressed:
        compressed = compressed[0].upper() + compressed[1:]
    return compressed

def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)

def estimate_co2_saved(tokens_saved: int) -> float:
    return round(tokens_saved * 0.001, 6)

def estimate_water_saved(tokens_saved: int) -> float:
    return round(tokens_saved * 0.0003, 6)