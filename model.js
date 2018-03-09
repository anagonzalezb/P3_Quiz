const Sequelize = require('sequelize');
const sequelize= new Sequelize("sqlite:quizzes.sqlite",{logging:false});

sequelize.define('quiz', {
    question: {
        type: Sequelize.STRING,
        unique: {msg: "Ya existe esta pregunta."},
        validate: {notEmpty: {msg: "La pregunta no puede estar vacía."}}
    },
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {msg: "La respuesta no puede estar vacía."}}
    }
});

sequelize.sync()
.then(() => sequelize.models.quiz.count()) 
.then(count => {
    if (!count) {

        return sequelize.models.quiz.bulkCreate([
            { question: "¿Tu novi@ te pone los cuernos? ", answer: "si"},
            { question: "¿Crees que conseguirás algún día a tu amor platónico? ", answer: "no"},
            { question: "¿Ser Teleco ayuda a ligar? ", answer: "no"},
            { question: "¿Crees que tu pareja te querrá/quiere solo por interés? ", answer: "si"},
            { question: "¿Morirás sol@? ", answer: "si"}
        ]);
    }
})
.catch(error => {
    console.log(error);
});

module.exports = sequelize;
