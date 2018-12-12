const Influx = require('influx');
const express = require('express');
const http = require('http');
const os = require('os');
const cors = require('cors');
const si = require('systeminformation');

const app = express();
app.use(cors());

const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'express_response_db',
    schema: [
        {
            measurement: 'cpu_load',
            fields: {
                duration: Influx.FieldType.FLOAT
            },
            tags: [
                'host'
            ]
        },
        {
            measurement: 'ram_load',
            fields: {
                total: Influx.FieldType.INTEGER,
                free: Influx.FieldType.INTEGER,
                used: Influx.FieldType.INTEGER,
                percentage: Influx.FieldType.FLOAT
            },
            tags: [
                'host'
            ]
        }
    ]
});
influx.getDatabaseNames()
    .then(names => {
        if (!names.includes('express_response_db')) {
            return influx.createDatabase('express_response_db');
        }
    })
    .then(() => {
        http.createServer(app).listen(3000, function () {
            console.log('Listening on port 3000')
        })
    })
    .catch(err => {
        console.error(`Error creating Influx database!`);
    });


app.get('/ping', function (req, res) {
    res.json({ ping: "pong" });
})

app.get('/:node/cpu', function (req, res) {
    influx.query(`
      select * from cpu_load
      where host = ${Influx.escape.stringLit(req.params.node)}
      and time > now() - 1h
      order by time desc
    `).then(result => {
        res.json(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    })
});

app.get('/:node/ram', function (req, res) {
    influx.query(`
      select * from ram_load
      where host = ${Influx.escape.stringLit(req.params.node)}
      and time > now() - 1h
      order by time desc
    `).then(result => {
        res.json(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    })
});

app.get('/:node/bots', function(req, res) {
    influx.query(`
        select * from bots_running
        where host = ${Influx.escape.stringLit(req.params.node)}
        and time > now() - 1h
        order by time desc
    `).then(result => {
        res.json(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    })
});