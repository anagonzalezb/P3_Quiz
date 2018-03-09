
const figlet =require('figlet');
const chalk = require('chalk');



/** Para dar color 
 */
colorize = (msg, color) => {
  if (typeof color !== "undefined"){
    msg = chalk[color].bold(msg);
  }
  return msg;
};

/** escribir mensaje
 */
log =(msg, color) => {
  console.log(colorize(msg,color));
};

biglog =(msg, color) => {
  log(figlet.textSync(msg,{horizontalLayaut: 'full'}), color);
};

errorlog =(emsg) => {
  console.log(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}`);
};

exports = module.exports = {colorize, log, biglog, errorlog};
  

