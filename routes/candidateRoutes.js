const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { jwtAuthMiddleware, generateToken } = require("../jwt");
const Candidate = require("../models/candidate");

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (user.role === "admin") {
      return true;
    }
  } catch (err) {
    return false;
  }
};
// show candidatees
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find();

    res.json(candidates);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

// POST route to add a candidate
router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    const data = req.body; // Assuming the request body contains the candidate data

    // Create a new User document using the Mongoose model
    const newCandidate = new Candidate(data);

    // Save the new user to the database
    const response = await newCandidate.save();
    console.log("data saved, candidate added");
    res.status(200).json({ response: response });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//  update a candiadate
router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID; // Extract the id from the URL parameter
    const updatedCandidateData = req.body; // Updated data for the person

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation
      },
    );

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate data updated");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// /. delete candidate
// Delete candidate
router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({
        message: "Only admin can delete candidate",
      });

    const candidate = await Candidate.findByIdAndDelete(req.params.candidateID);

    if (!candidate)
      return res.status(404).json({
        message: "Candidate not found",
      });

    res.json({
      message: "Candidate Deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

// / let's start voting
router.post("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
  // no admin can vote
  // user can only vote once

  candidateID = req.params.candidateID;
  userId = req.user.id;

  try {
    // Find the Candidate document with the specified candidateID
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (user.role == "admin") {
      return res.status(403).json({ message: "admin is not allowed" });
    }
    if (user.isVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    // Update the Candidate document to record the vote
    candidate.votes.push({ user: userId });
    candidate.voteCount++;
    await candidate.save();

    // update the user document
    user.isVoted = true;
    await user.save();

    return res.status(200).json({ message: "Vote recorded successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


//  for sorted order or who is winngin 
router.get("/vote",async  (req,res)=>{
    const cand=await Candidate.find();// extract all cand
    const finalcand=cand.map((data)=>({
        party:data.party,
        voteCount:data.voteCount

    }))
    // / Sort the array in memory by voteCount descending (high to low)
    finalcand.sort((a, b) => b.voteCount - a.voteCount)
    // res.status(500).json({ error: "Internal Server Error" });
    res.json({finalcand});

})
module.exports = router;
