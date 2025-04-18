import sys
import dspy
import json
import os
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

def load_json() -> list[str]:
    file_path = os.path.join("/app/OSS-doorway/src/config/response.json") 
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)  
    results = []
    for entry in data:  
        if isinstance(entry, dict):  
            for key, value in entry.items():
                if value:  
                    results.append(str(value))  
    return results

class RAG(dspy.Module):
    def __init__(self):
        self.respond = dspy.Predict('context, question -> response')

    def forward(self, question):
        return self.respond(context=load_json(),question=question)

def quizAnswer(answer):
    quest = f"""format this answer into this format [x,x,x,x...] with brackets
    at the end and commas seperating the answers , answer ={answer}"""
    rep = RAG()
    return rep(question=quest).response

if __name__ == '__main__':
    print(quizAnswer(sys.argv[1]))

