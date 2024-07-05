var userData = {
    'accepted': {
        'Q1': {
            'T1': {
                completed: false
            }
        }
    },
    'completed': {
        'Q2': {
            'T1': {
                completed: true
            }
        }
    }
};

console.log('Before moving:', JSON.stringify(userData, null, 2));

userData.completed['Q1'] = userData.accepted['Q1'];

console.log('After moving:', JSON.stringify(userData, null, 2));

