import sys
import dspy
import json
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

def load_json() -> list[str]:
    with open("qa_data.json", "r", encoding="utf-8") as file:
        data = json.load(file)
    results = [entry["answer"] for entry in data]
    return results

class RAG(dspy.Module):
    def __init__(self):
        self.respond = dspy.ChainOfThought('context, question -> response')

    def forward(self, question):
        return self.respond(context=load_json(),question=question)

def ragAnswer(question,answer,correctAnswer):
    quest = f"""On a scale from 0-100 how correct is this answer,
    Question:{question},Answer:{answer},Correct Answer:{correctAnswer}"""
    rep = RAG(question=quest)
    return rep.answer

if __name__ == '__main__':
    print(ragAnswer(sys.argv[1],sys.argv[2],sys.argv[3]))
