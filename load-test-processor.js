let counter = 0;
module.exports = {
  setPhone: function (context, events, done) {
    counter += 1;
    const base = (Date.now() % 100000).toString().padStart(5, "0");
    context.vars.phone = "6" + base + counter.toString().padStart(2, "0").slice(-2);
    return done();
  },
};
