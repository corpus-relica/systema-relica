#!/usr/bin/env python3

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

class ModelProvider(Enum):
    GROQ = "groq"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"

@dataclass
class ModelConfig:
    provider: ModelProvider
    model_name: str
    temperature: float = 0.7
    max_tokens: int = 1000
    timeout: int | None = None
    max_retries: int = 2
    stop: List[str] = field(default_factory=list)

@dataclass
class AgentConfig:
    # Model configurations for different nodes
    thought_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider=ModelProvider.GROQ,
        # model_name="meta-llama/llama-4-maverick-17b-128e-instruct",
        # model_name="qwen-qwq-32b",
        model_name="mistral-saba-24b",
        stop=['</thought>']
    ))

    action_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider=ModelProvider.GROQ,
        # model_name="meta-llama/llama-4-maverick-17b-128e-instruct",
        # model_name="qwen-qwq-32b",
        model_name="mistral-saba-24b",
        # model_name="llama-3.1-8b-instant",
        stop=['\nObservation', '\nFinal Answer', '\nThought', '\nAction']
    ))
    
    final_answer_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider=ModelProvider.GROQ,
        # model_name="meta-llama/llama-4-maverick-17b-128e-instruct",
        # model_name="qwen-qwq-32b",
        model_name="mistral-saba-24b",
        stop=['\nObservation', '\nFinal Answer', '\nThought', '\nAction']
    ))

    # Agent behavior settings
    max_iterations: int = 3
    default_temperature: float = 0.7

    # Tool settings
    tool_timeout: int = 30  # seconds
    max_tool_attempts: int = 3

    # State management
    initial_state: Dict[str, Any] = None

    def __post_init__(self):
        if self.initial_state is None:
            self.initial_state = {
                "messages": [],
                "scratchpad": "",
                "thought": None,
                "answer": None,
                "selected_entity": None,
                "cut_to_final": False,
                "loop_idx": 0,
                "next_step": ""
            }

def get_model_instance(config: ModelConfig):
    """Factory function to create model instances based on configuration"""
    if config.provider == ModelProvider.GROQ:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model_name=config.model_name,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            timeout=config.timeout,
            max_retries=config.max_retries,
            stop=config.stop if config.stop else None,
        )
    elif config.provider == ModelProvider.OPENAI:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=config.model_name,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            timeout=config.timeout,
            max_retries=config.max_retries,
            stop=config.stop if config.stop else None
        )
    elif config.provider == ModelProvider.ANTHROPIC:
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=config.model_name,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            timeout=config.timeout,
            max_retries=config.max_retries,
            stop=config.stop if config.stop else None
        )
    elif config.provider == ModelProvider.LOCAL:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            temperature=config.temperature,
            base_url="http://127.0.0.1:1234/v1",
            openai_api_key="dummy_value",
            model_name=config.model_name,
            max_tokens=config.max_tokens,
            timeout=config.timeout,
            max_retries=config.max_retries,
            stop=config.stop if config.stop else None
        )
    else:
        raise ValueError(f"Unsupported model provider: {config.provider}")

# Default configuration instance
DEFAULT_CONFIG = AgentConfig()

#########################################################################

#!/usr/bin/env python3

# Model configuration

# openAIModel="gpt-4o-mini"
openAIModel="o3-mini"

# anthropicModel = "claude-3-opus-20240229"
anthropicModel = "claude-3-7-sonnet-latest"
# anthropicModel = "claude-3-5-sonnet-latest"

# localModel = "gemma-3-12b-it"
localModel = "mistral-nemo-instruct-2407"

def format_chat_history(messages):
    """
    Format message history into a readable string, safely handling different
    message formats and types.
    """
    if not messages:
        return ""

    formatted = ""
    for msg in messages:
        # Handle different message formats safely
        if isinstance(msg, dict):
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            formatted += f"""<{role}>\n{content}\n</{role}>\n"""
        # elif isinstance(msg, str):
        #     formatted += f"""message: {msg}\n"""
        # else:
        #     # For any other type, convert to string safely
        #     formatted += f"""message: {str(msg)}\n"""

    return formatted

# Action types for graph flow control
ACTION_CONTINUE = "continue"
ACTION_FINAL_ANSWER = "final_answer"
ACTION_MAX_LOOPS = "max_loops"
ACTION_THINK = "think"
ACTION_ACT = "act"
