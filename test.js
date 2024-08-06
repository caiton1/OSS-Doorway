var test = {'num':12}

function testFunc(num){
    num['num'] += 1;
    console.log(num);
}

testFunc(test)

console.log(test);
