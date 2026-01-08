const Counter = require("../models/counterModel");

async function initializeCounter(counterId) {
  const counter = await Counter.findById(counterId);
  if (!counter) {
    await Counter.create({ _id: counterId, sequence: 0 });
    console.log(`Counter "${counterId}" initialized with sequence 0`);
  }
}

async function getNextSequence(counterId) {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
}

module.exports = { initializeCounter, getNextSequence };
