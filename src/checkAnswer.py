import sys
import dspy
import json
import os
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

def load_file() -> list[str]:
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

def load_json(quest,task) -> list[str]:
    file_path = os.path.join("/app/OSS-doorway/src/config/response.json") 
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)  
    results = data[quest][task]['accept']
    return results

class RAG(dspy.Module):
    def __init__(self):
        self.respond = dspy.Predict('context, question -> response')

    def forward(self, question):
        return self.respond(context=load_file(),question=question)


def checkAnswer(answer,realAnswer,quest,task):
    context = load_json(quest,task)
    quest = f"""context{context} if this answer is the similar as correct, return true else return
    false, answer:{answer} correct answer:{realAnswer}"""
    rep = RAG()
    return rep(question=quest).response


if __name__ == '__main__':
    print(checkAnswer(sys.argv[1],sys.argv[2],quest=sys.argv[3],task=sys.argv[4]))

