
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

// read all from data file
function readData() {
    return JSON.parse(
        fs.readFileSync(path.join(__dirname, "data.json"), "utf8")
    );
}

// input to data file
function writeData(data) {
    fs.writeFileSync(
        path.join(__dirname, "data.json"),
        JSON.stringify(data, null, 2)
    );
}

//landing pge
app.get("/", (req, res) => {
     res.sendFile(path.join(__dirname, "index.html"));
});

//display all
app.get("/api/reservations", (req, res) => {
     const data = readData();
     res.json(data);
});

// display by id 
app.get("/api/reservations/:id", (req, res) => {
    const id = Number(req.params.id);
    const data = readData();

    const reservation = data.find(r => r.id === id);

    if (!reservation) {
         return res.status(404).json({
            message2: "Reservation not found"
        });
    }

    res.json(reservation);
});

//  new res
app.post("/api/reservations", (req, res) => {
    const { room, reserved_by, date, start_time, end_time } = req.body;

    if (
        room === undefined ||
        room === null ||
        String(room).trim() === "" ||
        typeof reserved_by !== "string" ||
        reserved_by.trim() === "" ||
        typeof date !== "string" ||
        !date.trim() ||
        typeof start_time !== "string" ||
        !start_time.trim() ||
        typeof end_time !== "string" ||
        !end_time.trim()
    ) {
        return res.status(400).json({
             message2: "room, reserved_by, date, start_time and end_time are required"
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            message2: "Enter valid date format: (YYYY-MM-DD) "
        });
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        return res.status(400).json({
            message2: "Invalid reservation date"
        });
    }

    if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(end_time) ||
        start_time >= end_time
    ) {
        return res.status(400).json({
            message2: "Enter valid time format: (HH:MM)"
        });
    }

    const data = readData();

    // logic if room is reserved
    const conflict = data.find(reservation =>
        String(reservation.room) === String(room).trim() &&
        reservation.date === date
    );

    if (conflict) {
        return res.status(409).json({
             message2: "! This room is already reserved on this date",
             conflictingReservation: conflict
        });
    }

    // gen new id
    const newId = data.length
        ? Math.max(...data.map(r => r.id)) + 1
        : 1;

    const newReservation = {
        id: newId,
        room: String(room).trim(),
        reserved_by: reserved_by.trim(),
        date: date,
        start_time: start_time,
        end_time: end_time
    };

    data.push(newReservation);
    writeData(data);

    res.status(201).json({
         message1: "Reservation created successfully",
         reservation: newReservation
    });
});

//delete servatiomn by id
app.delete("/api/reservations/:id", (req, res) => {
    const id = Number(req.params.id);
    const data = readData();

    const index = data.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).json({
            message2: "Reservation not found"
        });
    }

    const deleted = data.splice(index, 1)[0];

    writeData(data);

    res.json({
        message1: "Reservation deleted successfully",
        reservation: deleted
    });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
