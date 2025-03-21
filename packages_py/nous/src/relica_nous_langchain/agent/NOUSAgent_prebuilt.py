#!/usr/bin/env python3

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from datetime import datetime
import uuid

from src.relica_nous_langchain.SemanticModel import semantic_model

from src.relica_nous_langchain.agent.Common import (
    anthropicModel,
    openAIModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_CONTINUE,
    )
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )

# model = ChatAnthropic(
#     model=anthropicModel,
#     temperature=0.7,
#     max_tokens=1500,
#     timeout=None,
#     max_retries=2,
# ).bind_tools(tools)

model = ChatOpenAI(
    model=openAIModel,
    # temperature=0,
    max_tokens=1500,
    timeout=None,
    max_retries=2,
    ).bind_tools(tools)


background_info = '''
Building on this foundation: The core innovation of this framework - a foundational ontology defining five essential types (_Physical Object, Aspect, Role, Relation, State/Occurrence_) and their interrelationships. This layer establishes the semantically meaningful patterns that all domain models must follow, creating a unified conceptual framework for understanding entities and processes across domains. The quintessential types serve as cognitive primitives that align with human conceptual understanding while supporting formal computational representation.

### Core Constructs

![quintessential_model.png](quintessential_model.png)

#### Physical Object

Fundamentally the semantic model is physically oriented.

Physical objects can play roles in relations.

Physical objects can be involved in occurrences (which is a special class of playing a role in a relation).

Physical objects can possess aspects.

#### Aspect

Aspect is (definition of aspect here...like its thing that exists conceptually separate from but not independent of its possessor...basically a property).

Can be 'quantitative' (e.g. 12.3) or 'qualitative' (e.g. 'red').

Quantitative may have associated UoM.

Aspects can be possessed by physical objects.

Aspects can be possessed by occurrences.

#### Role

Role can be played by physical object (probably aspect too? and maybe occurrence and relation?).

Role is required by relation.

#### Relation

Requires a role-1

Requires a role-2

#### State/Occurrence

A higher order relation involving potentially more than two things.

Occurrence is a type of relation.

### Enabled dynamics

This base scaffolding along with underlying knowledge from the semantic model enables the expression and management of further dynamics in this higher level semantic space.

#### Physical Object

##### Composition

1190:assembly relation of a part in a whole individual physical object

Physical object can have parts, and those parts parts, and so on.

##### Connection

1487:connection relation

Physical objects can be connected.

#### Aspect


#### Role


#### Relation


#### State/Occurrence

##### Sequence of occurrence

Sequences of occurrences can be expressed with various degrees of specificity.

##### Aspects and States over time

Aspects and states can be said to change over time.

## Domain modelling

### Knowledge modelling at gellish level

Slightly out of scope but briefly need to explain that and gesture at how knowledge is described at the gellish level to enable expression/manipulation/interpretation at this quintessential level.

### Modelling and derivation of domain objects for application use

- Define query(s)
- Filter
- Transform
- Populate object schema
'''


background_info = """
"""



foo_prompt = """
You are NOUS, an advanced AI assistant specializing in semantic modeling for Systema Relica. Your primary function is to help users understand and navigate complex semantic models with dynamic environments. Here's the essential background information for the semantic model you're working with:

<background>
{BACKGROUND}
</background>

As you assist users, keep in mind that the semantic model environment is dynamic and may change between interactions. Here are some key points to remember:

1. New facts or entities may be added or removed at any time.
2. The selected entity may change during our conversation.
3. Don't apologize for previously 'missing' information that wasn't available at that time.
4. Simply acknowledge updated information and continue with your assistance.

When responding to queries:

1. Focus on understanding the structure and relationships in the data, rather than trying to memorize every detail.
2. Be comfortable referring back to the provided model information as needed.
3. Be clear about what information comes directly from the data and what might be an interpretation.
4. When in doubt about specific details, check the model information provided before responding.
5. Interpret the ontological structure in a practical way, explaining relationships in simple terms.

Here's the current state of the environment:

<environment>
{ENVIRONMENT}
</environment>

The currently selected entity is:

<selected_entity>
{SELECTED_ENTITY}
</selected_entity>

Current time:
<current_time>
{CURRENT_TIME}
</current_time>

You have access to the following tools:

<tool_descriptions>
{tool_descriptions}
</tool_descriptions>

When using these tools, always check that you have all required parameters before making a call. If any required parameters are missing, do not attempt to use the tool.

Remember to be adaptable to changes in the environment and always strive to provide the most accurate and helpful information based on the current state of the semantic model.

When answering a user query, follow these steps:

1. Analyze the query, current environment, background, and selected entity. Identify key elements relevant to the query.
2. List potential tools that could be useful to answer the query, noting their required parameters and whether they're available in the current context.
3. Create a detailed plan of action, including any necessary tool usage and how you'll combine information from different sources.
4. Consider potential challenges or limitations in your approach and how you might address them.
5. Execute your plan, using tools as needed.
6. Formulate a clear and concise response based on the information gathered.


Please provide your analysis, planning, and response.
"""

# Wrap your analysis and planning process in <analysis_and_planning> tags before providing your final response in <response> tags. It's OK for the analysis and planning section to be quite long.
# Here is the user's query:

# <user_query>
# {USER_QUERY}
# </user_query>

# Here's how you should structure your response:

# 1. First, in <analysis> tags:
#    a. Summarize the user's question
#    b. Identify relevant entities and relationships from the background and environment
#    c. Consider which tools might be necessary and why
#    d. Outline a step-by-step approach to answering the question
# 2. If you need to use any tools, do so within <tool_usage> tags. Include the tool name, parameters, and results.
# 3. Provide your final answer to the user within <answer> tags.

# Now, please address the following user question:

# <user_question>
# {USER_QUESTION}
# </user_question>


















# Create a system message with all our context information
def create_system_message():
    current_entity = semantic_model.selected_entity or "No entity currently selected"
    current_environment = semantic_model.context or "No environment data available"

    sys_message = foo_prompt.format(
        BACKGROUND=background_info,
        ENVIRONMENT=current_environment,
        SELECTED_ENTITY=current_entity,
        CURRENT_TIME=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        tool_descriptions=tool_descriptions,
        # USER_QUESTION=user_question,
        )
    return SystemMessage(content=sys_message)
    # return SystemMessage(content=(
    #     "You are NOUS, a helpful semantic modelling assistant for Systema Relica. "
    #     "Use the provided information to answer the user's questions."

    #     "\n\n## IMPORTANT: Environment Information"
    #     "\nThe semantic model environment is dynamic and may change between interactions. If you notice changes in the available entities, facts, or relationships:"
    #     "\n- This is expected behavior, not a mistake on your part"
    #     "\n- New facts or entities may be added or removed at any time"
    #     "\n- The selected entity may change during our conversation"
    #     "\n- Don't apologize for previously 'missing' information that wasn't available at that time"
    #     "\n- Simply acknowledge the updated information and continue with your assistance"

    #     "\n\n## Guidance for Responses"
    #     "\n- Focus on understanding the structure and relationships in the data, rather than trying to memorize every detail"
    #     "\n- Be comfortable referring back to the provided model information as needed"
    #     "\n- Be clear about what information comes directly from the data and what might be an interpretation"
    #     "\n- When in doubt about specific details, check the model information provided before responding"
    #     "\n- Interpret the ontological structure in a practical way, explaining relationships in simple terms"

    #     f"\n\nInformation about the Semantic Model:\n<Background>\n{background_info}\n</Background>"
    #     f"\n\nCurrent Environment:\n<Environment>\n{current_environment}\n</Environment>"
    #     f"\n\nCurrent Selected Entity:\n<SelectedEntity>\n{current_entity}\n</SelectedEntity>"
    #     f"\n\nCurrent time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}."
    # ))

# Create a memory saver with a unique thread ID
memory = MemorySaver()
config = {"configurable": {"thread_id": str(uuid.uuid4())}}

# Create the agent with the tools but without binding the prompt yet
# This way we can create the system message with current state each time
graph = create_react_agent(model, tools=tools)

async def handleInput(user_input: str):
    """
    Handle user input by running it through the agent graph
    Returns an AIMessage object with the final response
    """
    print(f"-------------------- Processing user input: {user_input}")
    
    # Create a fresh system message with current state
    system_msg = create_system_message()
    
    # Create a human message from the input
    human_msg = HumanMessage(content=user_input)
    
    # Create the inputs for the graph
    inputs = {
        "messages": [system_msg, human_msg],
    }
    
    # Keep track of the last message
    last_message = None
    response_content = ""

    try:
        # Use the same thread ID for conversation continuity
        config["configurable"]["thread_id"] = "nous-agent-conversation"
        
        async for s in graph.astream(inputs, config=config, stream_mode="values"):
            # Get the last message from the response
            if "messages" in s and s["messages"]:
                message = s["messages"][-1]
                last_message = message
                
                if isinstance(message, AIMessage):
                    print(f"**AI Assistant**: {message.content}")
                    response_content = message.content
                elif isinstance(message, tuple) and message[0] == "assistant":
                    print(f"**AI Assistant**: {message[1]}")
                    response_content = message[1]
                else:
                    print(f"Message: {message}")
        
        # Create an AIMessage for the response
        result = AIMessage(content=response_content)
        print("Stream complete. Final response:", result.content)
        return result
        
    except Exception as e:
        # Return a proper AIMessage with the error information
        error_message = f"I encountered an error: {str(e)}"
        print(f"Error during graph execution: {e}")
        return AIMessage(content=error_message)
