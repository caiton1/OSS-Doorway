import sys
import dspy
import os
import openai
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

def addResponse(hint):
    qa = dspy.ChainOfThought("question -> answer: str")
    quest = f"reword this text:{hint}"
    rep = qa(question=quest)
    return rep.answer

if __name__ == '__main__':
    print(addResponse(sys.argv[1]))
