let addBottleButton = undefined;
let addNappyButton = undefined;
let addMedicineButton = undefined;
let viewChartButton = undefined;
let feedDiv = undefined;
let chartDiv = undefined;
let feeds = [];
const Days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

const TypeEnum = {
  Bottle: "Bottle",
  Nappy: "Nappy",
  Medicine: "Medicine",
};
const TypeSymbols = {
  Bottle: "🍼",
  Nappy: "💩",
  Medicine: "💊",
};
const MedicineType = {
  Paracetamol: "Paracetamol",
  Ibuprofen: "Ibuprofen",
  Antibiotics: "Antibiotics",
};
const MedicineSymbols = {
  Paracetamol: "⚪",
  Ibuprofen: "🔴",
  Antibiotics: "💊",
};

const MedicineIntervals = {
  Paracetamol: 4,
  Ibuprofen: 6,
  Antibiotics: 8,
};

window.onload = function () {
  addBottleButton = document.getElementById("add-bottle");
  viewChartButton = document.getElementById("view-charts");
  feedDiv = document.getElementById("previous-feeds");
  chartDiv = document.getElementById("charts");
  const feedDialog = document.getElementById("feed-dialog");
  const closeButton = document.querySelector("#feed-dialog button");
  const feedInput = document.getElementById("add-feed");
  const timeInput = document.createElement("input");
  addMedicineButton = document.getElementById("add-medicine");
  timeInput.type = "datetime-local";
  timeInput.id = "feed-time";
  timeInput.value = getLocalDateTimeString(new Date());

  showFeedDiv();

  timeInput.setAttribute(
    "min",
    getLocalDateTimeString(
      new Date(new Date().setDate(new Date().getDate() - 5))
    )
  );

  feedDialog.insertBefore(timeInput, closeButton);

  InitialiseNappyFunctionality();
  InitialiseMedicineFunctionality();
  RemoveOverThreeMonth();
  GenerateFeedList();

  addBottleButton?.addEventListener("click", (e) => {
    showFeedDiv();
    e.preventDefault();
    timeInput.value = getLocalDateTimeString(new Date());
    feedDialog.showModal();
  });

  viewChartButton?.addEventListener("click", (e) => {
    e.preventDefault();
    showChartsDiv();
  });

  closeButton.addEventListener("click", () => {
    let currentFeed = {
      Time: new Date(timeInput.value) || new Date(),
      Value: parseFloat(feedInput.value) || 0,
      Type: TypeEnum.Bottle,
    };

    if (currentFeed.Value > 0) {
      let items = JSON.parse(localStorage.getItem("FeedList")) ?? [];
      items.push(currentFeed);
      items.sort((a, b) => new Date(a.Time) - new Date(b.Time));
      feeds = items;
      localStorage.setItem("FeedList", JSON.stringify(items));
      feedInput.value = "";
    }

    feedDialog.close();
    GenerateFeedList();
  });
};

function showFeedDiv() {
  feedDiv.style.display = "block";
  chartDiv.style.display = "none";
}
function showChartsDiv() {
  feedDiv.style.display = "none";
  chartDiv.style.display = "block";
  chartDiv.innerHTML =
    '<canvas id="feedChart" width="400" height="200"></canvas>';

  const ctx = document.getElementById("feedChart").getContext("2d");

  // Ensure feeds are loaded
  const allFeeds = feeds.length
    ? feeds
    : JSON.parse(localStorage.getItem("FeedList")) ?? [];

  const bottleFeeds = allFeeds
    .filter((f) => f.Type === TypeEnum.Bottle)
    .sort((a, b) => new Date(a.Time) - new Date(b.Time));

  const dailyTotalsMap = {};

  bottleFeeds.forEach((feed) => {
    const date = new Date(feed.Time);
    const key = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`; // e.g. "2025-4-19"

    if (!dailyTotalsMap[key]) {
      dailyTotalsMap[key] = {
        totalOz: 0,
        label: `${Days[date.getDay()]} ${date.getDate()} ${date.toLocaleString(
          "default",
          {
            month: "short",
          }
        )}`,
      };
    }

    dailyTotalsMap[key].totalOz += Number(feed.Value);
  });

  // Get labels and data
  const sortedKeys = Object.keys(dailyTotalsMap).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const labels = sortedKeys.map((k) => dailyTotalsMap[k].label);
  const data = sortedKeys.map((k) => dailyTotalsMap[k].totalOz);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily Total Oz Drank",
          data,
          fill: true,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgb(75, 192, 192)",
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.raw} oz total`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Oz Drank",
          },
          beginAtZero: true,
        },
      },
    },
  });
}

function InitialiseNappyFunctionality() {
  //
  addNappyButton = document.getElementById("add-nappy");

  addNappyButton?.addEventListener("click", (e) => {
    e.preventDefault();

    let currentNappy = {
      Time: new Date(),
      Value: 1,
      Type: TypeEnum.Nappy,
    };

    let items = JSON.parse(localStorage.getItem("FeedList")) ?? [];
    items.push(currentNappy);
    items.sort((a, b) => new Date(a.Time) - new Date(b.Time));
    feeds = items;

    localStorage.setItem("FeedList", JSON.stringify(items));

    GenerateFeedList();
  });
}
let medicineSubmitListenerAdded = false;

function InitialiseMedicineFunctionality() {
  // Ensure the event listener is only attached after the page has loaded
  addMedicineButton?.addEventListener("click", () => {
    const medicineDialog = document.getElementById("medicine-dialog");
    const medicineTypeSelect = document.getElementById("medicine-type");

    // Open the dialog when the button is clicked
    medicineDialog.showModal();

    const submitButton = document.getElementById("medicine-submit");

    // Add the event listener only once to prevent duplicates
    if (!medicineSubmitListenerAdded) {
      submitButton.addEventListener("click", () => {
        const medicineType = medicineTypeSelect.value;

        if (!medicineType) {
          alert("Please select a valid medicine type.");
          return;
        }

        const now = new Date();
        const nextDue = new Date(now);
        nextDue.setHours(now.getHours() + MedicineIntervals[medicineType]);

        let newMedicine = {
          Time: now,
          Type: TypeEnum.Medicine,
          Medicine: medicineType,
          NextDue: nextDue,
        };

        let items = JSON.parse(localStorage.getItem("FeedList")) ?? [];
        items.push(newMedicine);
        items.sort((a, b) => new Date(a.Time) - new Date(b.Time));
        feeds = items;

        localStorage.setItem("FeedList", JSON.stringify(items));
        GenerateFeedList();

        // Close the dialog after submission
        medicineDialog.close();
      });

      // Set flag to true, so we don't add the listener again
      medicineSubmitListenerAdded = true;
    }
  });
}

function getLocalDateTimeString(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function GenerateFeedList() {
  if (!feeds.length) {
    feedDiv.innerText = "No Data To Display! Add A Feed";
  } else {
    feedDiv.innerText = "";
    const FeedList = document.createElement("ul");
    FeedList.classList.add("feed-list");
    const dailyTotals = {};

    feeds.forEach((feed, index) => {
      let date = new Date(feed.Time);
      let dayName = `${
        Days[date.getDay()]
      } ${date.getDate()} ${date.toLocaleString("default", {
        month: "short",
      })}`;

      let totalMinutes = date.getHours() * 60 + date.getMinutes(); // Convert feed time to minutes

      if (!dailyTotals[dayName]) {
        dailyTotals[dayName] = {
          Value: 0,
          TotalBottles: 0,
          TotalMinutes: [],
          TotalNappies: 0,
          ToTalMedicine: {
            Paracetamol: 0,
            Ibuprofen: 0,
            Antibiotics: 0,
          },
        };
      }

      if (feed.Type === TypeEnum.Bottle) {
        dailyTotals[dayName].Value += Number(feed.Value);
        dailyTotals[dayName].TotalBottles += 1;
        dailyTotals[dayName].TotalMinutes.push(totalMinutes); // Store time in minutes
      }
      if (feed.Type === TypeEnum.Nappy) {
        dailyTotals[dayName].TotalNappies += 1;
      }
      if (feed.Type === TypeEnum.Medicine) {
        dailyTotals[dayName].ToTalMedicine[feed.Medicine] += 1;
      }

      let li = document.createElement("li");
      // add the symbols below
      li.className = "feed-item";

      let initialHTML = `<span>${
        feed.Type === TypeEnum.Medicine
          ? `${MedicineSymbols[feed.Medicine]} `
          : TypeSymbols[feed.Type]
      } ${dayName} ${date.getHours() % 12 || 12}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}</span > ${
        feed.Type === TypeEnum.Medicine
          ? `<span><strong>Next Due:</strong> ${
              new Date(feed.NextDue).getHours() % 12 || 12
            }:${new Date(feed.NextDue)
              .getMinutes()
              .toString()
              .padStart(2, "0")} ${
              new Date(feed.NextDue).getHours() >= 12 ? "PM" : "AM"
            }</span>`
          : ""
      }`;
      let middleHTML = ``;
      if (feed.Type === TypeEnum.Bottle) {
        middleHTML = `<span><strong>Drank:</strong> ${feed.Value} oz</span>`;
      }
      li.innerHTML = ` ${initialHTML} ${middleHTML} <button class="delete-button" data-index="${index}">Delete</button>`;

      FeedList.appendChild(li);
    });

    feedDiv.appendChild(FeedList);

    const deleteButtons = document.querySelectorAll(".delete-button");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = parseInt(button.getAttribute("data-index"), 10);
        DeleteFeedItem(index);
      });
    });

    const TotalsDiv = document.createElement("div");

    TotalsDiv.innerHTML = "<h3>Daily Totals</h3>";
    const TotalsList = document.createElement("ul");
    TotalsList.classList.add("daily-totals-list");

    for (let day in dailyTotals) {
      dailyTotals[day].TotalMinutes.sort((a, b) => a - b);

      let totalDiff = 0;
      let avgHours = 0;
      let avgMins = 0;

      if (dailyTotals[day].TotalBottles > 1) {
        for (let i = 1; i < dailyTotals[day].TotalMinutes.length; i++) {
          totalDiff +=
            dailyTotals[day].TotalMinutes[i] -
            dailyTotals[day].TotalMinutes[i - 1];
        }
        let avgMinutes = Math.round(
          totalDiff / (dailyTotals[day].TotalBottles - 1)
        );
        avgHours = Math.floor(avgMinutes / 60);
        avgMins = avgMinutes % 60;
      }

      let totalLi = document.createElement("li");
      totalLi.classList.add("daily-total");

      let liHTML = `
        <div class="daily-total__values">
          <div><strong>${day}</strong> </div>
          <div><strong>${
            dailyTotals[day].TotalBottles
          }</strong> <span class='b-emogi'>🍼</span></div>
          <div><strong>${dailyTotals[day].Value}</strong> oz</div>
          <div><strong>${(
            Number(dailyTotals[day].Value) * 28.6
          ).toFixed()}</strong> ml</div>
          
          ${
            dailyTotals[day].TotalBottles > 1
              ? `
                <span >
                  <strong>  Avg: </strong>${avgHours}h:${avgMins
                  .toString()
                  .padStart(2, "0")}m
                </span>`
              : "<div>Only one feed</div>"
          }
          <div><div><strong>${
            dailyTotals[day].TotalNappies
          }</strong> </div><div class='p-emogi'>💩</div></div>
          
        
         
        </div> <div class="daily-total-medicines">
            
          
              ${Object.keys(dailyTotals[day].ToTalMedicine)
                .map((medicine) =>
                  dailyTotals[day].ToTalMedicine[medicine] > 0
                    ? `<div>${MedicineSymbols[medicine]}: ${dailyTotals[day].ToTalMedicine[medicine]}</div>`
                    : ""
                )
                .join("")}
           
          </div>`;

      totalLi.innerHTML = liHTML;

      totalLi.innerHTML = liHTML;
      TotalsList.appendChild(totalLi);
    }

    TotalsDiv.appendChild(TotalsList);
    feedDiv.appendChild(TotalsDiv);
    const previousFeed = document.querySelector(".feed-list");
    const totals = document.querySelector(".daily-totals-list");

    previousFeed.scrollTo({
      top: previousFeed.scrollHeight,
      behavior: "smooth",
    });
    totals.scrollTo({
      top: totals.scrollHeight,
      behavior: "smooth",
    });
  }
}

function DeleteFeedItem(index) {
  feeds.splice(index, 1);
  localStorage.setItem("FeedList", JSON.stringify(feeds));
  GenerateFeedList();
}

function RemoveOverThreeMonth() {
  const List = localStorage.getItem("FeedList");
  const items = List ? JSON.parse(List) : [];

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  if (items.length > 0) {
    const inDateItems = items.filter(
      (item) => new Date(item.Time) >= threeMonthsAgo
    );
    // remove in a week
    items.forEach((item) => {
      if (!item.Type) {
        item.Type = TypeEnum.Bottle;
      }
    });
    inDateItems.sort((a, b) => new Date(a.Time) - new Date(b.Time));
    feeds = inDateItems;
    localStorage.setItem("FeedList", JSON.stringify(inDateItems));
  }
}
