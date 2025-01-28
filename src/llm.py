import sys
import dspy
api_key = os.getenv('OPENAI_API_KEY')

def add(a, b):
    return int(a) + int(b)

lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)
dspy.configure(lm=lm)

if __name__ == '__main__':
    num1,num2 = sys.argv[1], sys.argv[2]
    qa = dspy.ChainOfThought('question -> answer: int')
    response = qa(question=f"What is the sum of {num1} and {num2}")
    print(response.answer)

