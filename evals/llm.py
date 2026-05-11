import os
from deepeval.models.base_model import DeepEvalBaseLLM
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

class GroqLangChainModel(DeepEvalBaseLLM):
    def __init__(self, model_name="llama-3.1-8b-instant"):
        self.model_name = model_name
        self.model = ChatGroq(
            model=model_name,
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0
        )
    def load_model(self):
        return self.model

    def generate(self, prompt: str) -> str:
        response = self.model.invoke(prompt)
        return response.content

    async def a_generate(self, prompt: str) -> str:
        response = await self.model.ainvoke(prompt)
        return response.content

    def get_model_name(self) -> str:
        return self.model_name