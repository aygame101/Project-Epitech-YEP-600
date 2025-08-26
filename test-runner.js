// test-runner.js
// Lanceur de tests pour le systeme de recommandation

const { runAllTests } = require('./tests/recommandation.test.js');

async function runTests() {
    console.log('LANCEMENT DES TESTS AUTOMATISES');
    console.log('=' .repeat(50));
    
    try {
        const results = await runAllTests();
        
        console.log('\nRESUME DES TESTS');
        console.log('=' .repeat(30));
        console.log(`Total des tests: ${results.total}`);
        console.log(`Tests reussis: ${results.passed}`);
        console.log(`Tests echoues: ${results.total - results.passed}`);
        console.log(`Taux de reussite: ${Math.round((results.passed / results.total) * 100)}%`);
        
        if (results.success) {
            console.log('\nTOUS LES TESTS ONT REUSSI!');
            process.exit(0);
        } else {
            console.log('\nCERTAINS TESTS ONT ECHOUE');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\nERREUR LORS DE L\'EXECUTION DES TESTS:');
        console.error(error);
        process.exit(1);
    }
}

// Lancer les tests si le script est execute directement
if (require.main === module) {
    runTests();
}

module.exports = { runTests }; 