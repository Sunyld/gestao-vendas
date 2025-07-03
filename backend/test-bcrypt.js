import bcrypt from "bcrypt";

const senhaDigitada = "123456";
const hashNoBanco = "$2b$10$nw6UDzt7POuOlCv9F6Xsf.OgmyBShIMXPjJ.NB0L6z1tZp2I6fw2G";

bcrypt.compare(senhaDigitada, hashNoBanco).then((result) => {
  console.log("Senha confere?", result); // Deve mostrar: true
});
