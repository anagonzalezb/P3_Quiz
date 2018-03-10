
const {models} = require('./model');
const {colorize, log, biglog, errorlog} = require("./out");
const Sequelize = require('sequelize');


exports.helpCmd = rl => {
      log("Comandos:");
      log("  h|help - Muestra esta ayuda.");
      log("  list - Listar los quizzes existentes.");
      log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
      log("  add - Añadir un nuevo quiz");
      log("  delete <id> - Borra el quiz indicado");
      log("  edit <id> - Edita el quiz indicado");
      log("  test <id> - Probar el quiz indicado");
      log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
      log("  credits - Créditos.");
      log("  q|quit - Salir del programa.");
      rl.prompt();
};

exports.listCmd = rl =>{

  models.quiz.findAll()
  .each(quiz => {
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
    rl.prompt();
    });
};

/* creamos una promesa
* esta funcion devuelve una promesa que:
* valida que se ha introducido un valor para el parametro 
*convierte el parametro en un numero entero
* si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
**/
const validateId = id =>{
  return new Sequelize.Promise((resolve,reject)=>{
    if (typeof id === "undefined"){
      reject(new Error(`Falta el parametro <id>.`));
    }else{
      id = parseInt(id); // coger la parte entera y descartar lo demas
      if( Number.isNaN(id)){
        reject(new Error(`El valor del parametro <id< no es un número`));
      }else{
        resolve(id);
      }
    }
  });
};

exports.showCmd = (rl, id) => {
  validateId(id) //esto me devuelve una promesa
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz){
      throw new Error(`No existe un quiz asociado al id =${id}.`);
    }
    log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>' , 'blue')} ${quiz.answer}`);
  })
  .catch(error =>{
    errorlog(error.message);
  })
  .then(() =>{
    rl.prompt();
  });
};
/**
*Esta funcion convierta la llamada rl.question, que esta basada en callbacks, en una basada en promesas
*esta funcion devulve una promesa que cuando se cumple, proporciona el texto introducido
*entonces la llamada a then que hay que hacer la promesa devuelta sera:
*.then(answer=> {...})
*tambien colorea en rojo e texto de la pregunta, elimina espacios al principio y 
* lepasamos como parametro rl y text ( pregunta que hay que hacerle al usuario)
*/
const makeQuestion = (rl,text) => {
  return new Sequelize.Promise((resolve,reject) => {
    rl.question(colorize(text,'blue'),answer =>{
      resolve(answer.trim());
    });
  });
};

exports.addCmd = rl => {
  makeQuestion(rl, 'Introduzca una pregunta: ')
    .then(q => {
        return makeQuestion(rl, 'Introduzca la respuesta: ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(` ${colorize('Se ha añadido.', 'blue')}: ${quiz.question} ${colorize('=>', 'blue')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erróneo.');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
  });   
};
    


exports.deleteCmd =(rl,id)=>{
  validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
  });
};
exports.editCmd =(rl, id)=>{
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, 'Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() =>{
     rl.prompt();
}); 
  
};



exports.testCmd = (rl, id) => {
      if (typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
      } 
      else{
         try{
           const quiz = model.getByIndex(id);
           rl.question(quiz.question.toString(), respuesta =>{
             if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase().trim() ){
               log('Su respuesta es correcta.','black');
               biglog("CORRECTA", 'green');
               rl.prompt();
             }
             else {log('Su respuesta es incorrecta.','black');
               biglog("INCORRECTA", 'red');
               rl.prompt();
             }
           });
         }catch(error) {
         errorlog(error.message);
         rl.prompt();
       }
      }
      
      
};


exports.playCmd =rl=>{

  let puntuacion =0; 
  let preguntas =[];
  for(i=0;i<models.quiz.count();i++){
  	preguntas[i]=i;
  }
  const playOne = () =>{
    return new Promise((resolve,reject)=>{
      if (preguntas.length ==0){
        log(`No hay nada mas que preguntar.`);
        log(`Fin el examen. Aciertos:`);
        //biglog(puntuacion ,'magenta');
        resolve();
       // rl.prompt();
        return;
      }
      let id= Math.abs(Math.floor((Math.random()*preguntas.length)));
      let quiz=preguntas[id];
      preguntas.splice(id,1);
      makeQuestion(rl,quiz.question)
      .then(answer => {
        if( answer.toLowerCase().trim()===quiz.answer){
          puntuacion++;
          log(`CORRECTO - Lleva ${puntuacion} aciertos.`);
          resolve(playOne());
        }else{
          log(`INCORRECTO`);
          log(`Fin del examen. Aciertos: ${puntuacion}`);
          //biglog(puntuacion, 'green');
          resolve();
        }
      })
    })
  }
  models.quiz.findAll({raw: true})// devuelve un string simplemente con la respuesta o lo que le digas que te saque
  .then(quizzes=>{
    preguntas =quizzes;
  })
  .then(()=>{
    return playOne();
  })
  .catch(e => {console.log("Error:" + e);
  })
  .then(()=>{
  	biglog(puntuacion,'green');
    rl.prompt();
  })
  
};
exports.creditsCmd = rl => {
      log('Autores de la práctica:', 'magenta');
      log('anagonzalezb', 'magenta');
      log('albadelgadof', 'magenta');
      rl.prompt();
};

exports.quitCmd = rl => {
     rl.close();
     rl.prompt();
};
