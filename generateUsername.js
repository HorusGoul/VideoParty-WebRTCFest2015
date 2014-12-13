function generateUsername(name, secretcode) {
    var nameArray = name.split("");
    var secretcodeArray = secretcode.split("");
    var cryptedName = crypt(nameArray);
    var cryptedSecretcode = crypt(secretcodeArray);
    var epoch = Math.round(+new Date() / 1000);
    var done = ((cryptedSecretcode * (epoch / (nameArray.length * 2))) / cryptedName);
    return done;
}

function checkUser(name, secretcode, id) {
    var nameArray = name.split("");
    var secretcodeArray = secretcode.split("");
    var cryptedName = crypt(nameArray);
    var cryptedSecretcode = crypt(secretcodeArray);
    var maths = ((id * cryptedName * (nameArray.length * 2)) / cryptedSecretcode);
    var maths2 = ((cryptedSecretcode * (maths / (nameArray.length * 2)) / cryptedName));
    var mathss = id.toString().split(".");
    var mathss2 = maths2.toString().split(".");
    var idd = id;
    if (parseFloat(idd).toFixed(mathss[1].length - 1) == parseFloat(maths2).toFixed(mathss2[1].length - 1)) {
        return true;
    } else {
        return false;
    }
}

function crypt(target) {
    var crypted = [];
    var abc = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "ñ", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "!", "?", "¿", "¡", "@", "#", "$", "%", "&", "/", "(", ")", "=", "<", ">", "A", "B", "C", "D", "F", "G", "H", "I", "J", "K", "L", "M", "N", "Ñ", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    for (i = 0; i < target.length; i++) {
        if ($.isNumeric(target[i])) {
            crypted.push(target[i]);
        } else {
            for (x = 0; x < abc.length; x++) {
                if (target[i] == abc[x]) {
                    crypted.push(abc.indexOf(abc[x]));
                }
            }
        }
    }
    if (target.length == crypted.length) {
        var wow = crypted.join("");
        return wow;
    }
}