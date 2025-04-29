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
        model_name="qwen-qwq-32b",
        stop=['</thought>']
    ))
    
    action_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider=ModelProvider.GROQ,
        model_name="qwen-qwq-32b",
        stop=['\nObservation', '\nFinal Answer', '\nThought', '\nAction']
    ))
    
    final_answer_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider=ModelProvider.GROQ,
        model_name="qwen-qwq-32b",
        stop=['\nObservation', '\nFinal Answer', '\nThought', '\nAction']
    ))

    # Agent behavior settings
    max_iterations: int = 4
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
            stop=config.stop if config.stop else None
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