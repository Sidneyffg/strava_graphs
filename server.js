const fs = require("fs");
const express = require("express");
const app = express();
app.set("view engine", "ejs");

const data = JSON.parse(fs.readFileSync("./data.json"));

app.get("/", (req, res) => {
  res.render(__dirname + "/site.ejs", {
    data: data,
  });
});

app.listen(3000, (req, res) => {
  console.log("server is running");
});


//refreshData();
async function refreshData() {
  const link = "https://www.strava.com/api/v3/athlete/activities?access_token=d94d7dec5e9a44f3507cfe89623d209d35d2f163",
  months = ["January","February","March","April","May","June","July","August","September","October","November","December"]

  fetch(link)
    .then((res) => res.json())
    .then((res) => {
      const date = new Date(),
      totalMonths = date.getFullYear() * 12 + date.getMonth(),
      firstActivityDate = new Date(res[res.length - 1].start_date);

      let data = new Array(totalMonths - (firstActivityDate.getFullYear() * 12 + firstActivityDate.getMonth()) + 1);
      for(let i = 0;i<data.length;i++){
        data[i] ={
          distance: 0,
          totalRuns:0,
          month: months[firstActivityDate.getMonth() + i]
        }
      }

      res.forEach(activity => {
        if(activity.type !== "Run") return
        const activityDate = new Date(activity.start_date),
        month = data.length - 1 - (totalMonths - (activityDate.getFullYear() * 12 + activityDate.getMonth()))
        data[month].distance += activity.distance;
        data[month].totalRuns++;
      });
      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    });
}

(new Date())