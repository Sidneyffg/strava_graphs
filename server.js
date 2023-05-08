const fs = require("fs");
const express = require("express");
const { type } = require("os");
const app = express();
app.set("view engine", "ejs");

const data = JSON.parse(fs.readFileSync("./data.json"));

app.get("/", (req, res) => {
  res.render(__dirname + "/site.ejs", {
    data: data.activityData,
  });
});

app.listen(3000, (req, res) => {
  console.log("server is running");
});

refreshData();
async function refreshData() {
  if (data.apiData.expires_at < Date.now() / 1000) {
    console.log("ello");
    fetch("https://www.strava.com/api/v3/oauth/token", {
      body: "client_id=106934&client_secret=aa5fc77933f7643d2b86c14c59f57367332b100d&grant_type=refresh_token&refresh_token=b5895643345a1d37523b5d23b5faa5ca26b4dd12",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })
      .then((res) => res.json())
      .then((res) => {
        data.apiData = res;
        getDataFromServer();
      });
    return;
  }
  console.log("ella");
  getDataFromServer();
}

function getDataFromServer() {
  const link = `https://www.strava.com/api/v3/athlete/activities?access_token=${data.apiData.access_token}`,
    months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

  fetch(link)
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
      const date = new Date(),
        totalMonths = date.getFullYear() * 12 + date.getMonth(),
        firstActivityDate = new Date(res[res.length - 1].start_date);

      let newData = {
        months: new Array(
          totalMonths -
            (firstActivityDate.getFullYear() * 12 +
              firstActivityDate.getMonth()) +
            1
        ),
        data: {
          totalDistance: 0,
          totalRuns: 0,
          run_types: {
            midnight: 0,
            morning: 0,
            lunch: 0,
            afternoon: 0,
            evening: 0,
          },
        },
      };
      for (let i = 0; i < newData.months.length; i++) {
        newData.months[i] = {
          distance: 0,
          totalRuns: 0,
          month: months[firstActivityDate.getMonth() + i],
          runs: [],
        };
      }

      res.forEach((activity) => {
        if (activity.type !== "Run") return;
        newData.data.run_types[getRunTime(activity.start_date_local)]++;
        const activityDate = new Date(activity.start_date),
          month =
            newData.months.length -
            1 -
            (totalMonths -
              (activityDate.getFullYear() * 12 + activityDate.getMonth()));

        newData.months[month].distance += activity.distance;
        newData.months[month].totalRuns++;
        newData.months[month].runs.unshift({
          distance: activity.distance,
          moving_time: activity.moving_time,
          name: activity.name,
        });
      });
      data.activityData = newData;
      saveData();
    });
}

function getRunTime(start_date_local) {
  const a = start_date_local.split(":")[0];
  const hours = parseInt(a.charAt(a.length - 2) + a.charAt(a.length - 1)),
    times = [6, 12, 14, 18, 24],
    types = ["midnight", "morning", "lunch", "afternoon", "evening"];

  for (let i = 0; i < times.length; i++) {
    if (hours < times[i]) {
      console.log(start_date_local, hours, types[i]);
      return types[i];
    }
  }
}

async function saveData() {
  fs.writeFile("./data.json", JSON.stringify(data, null, 2), (err) => {
    if (err) {
      throw err;
    }
  });
}
