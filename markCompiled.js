app.post("/api/markCompiled", async (req, res) => {

    await db.collection("events").insertOne({
        event: "compiled",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        timestamp: new Date()
    });

    res.json({ success: true });
	

    await db.collection("funnel").updateOne(
        { session: req.sessionID },
        { $set: { compiled: true } },
        { upsert: true }
    );

    res.sendStatus(200);
});

});