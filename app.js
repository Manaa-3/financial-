
const h = React.createElement;

const DEFAULT_DB = {
  settings: {
    salary: 13500,
    debt: 4000,
    cash: 0,
    emergency: 0,
    emergencyTarget: 25000,
    theme: "light",
    pin: ""
  },
  budget: {
    "رسوم مرافقين": 800,
    "إيجار": 2000,
    "قسط سيارة": 1700,
    "أكل وشرب": 2000,
    "حضانة": 500,
    "بنزين": 300,
    "كهرباء": 250,
    "صيانة سيارة": 150,
    "أخرى": 0
  },
  expenses: [],
  incomes: [],
  assets: { gold: 0, silver: 0, investments: 0 },
  goals: [
    { id: "1", name: "أول 100 ألف", target: 100000, current: 0 },
    { id: "2", name: "تعليم الابن", target: 300000, current: 0 }
  ]
};

function loadDB() {
  try {
    const saved = localStorage.getItem("financeV5");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_DB));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}
function money(n) {
  return Number(n || 0).toLocaleString("ar-SA", { maximumFractionDigits: 2 });
}
function monthKey(date) {
  return new Date(date || new Date()).toISOString().slice(0, 7);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

class App extends React.Component {
  constructor(props) {
    super(props);
    const db = loadDB();
    this.state = {
      db,
      page: "home",
      locked: Boolean(db.settings.pin),
      pinInput: "",
      expenseAmount: "",
      expenseCategory: Object.keys(db.budget)[0],
      expenseNote: "",
      goalName: "",
      goalTarget: "",
      newPin: ""
    };
  }

  componentDidMount() {
    this.persist();
  }

  persist = () => {
    localStorage.setItem("financeV5", JSON.stringify(this.state.db));
    document.documentElement.setAttribute("data-theme", this.state.db.settings.theme || "light");
  };

  updateDB = (mutator) => {
    const db = JSON.parse(JSON.stringify(this.state.db));
    mutator(db);
    this.setState({ db }, this.persist);
  };

  setPage = (page) => this.setState({ page });

  unlock = () => {
    if (this.state.pinInput === this.state.db.settings.pin) {
      this.setState({ locked: false, pinInput: "" });
    }
  };

  addExpense = () => {
    const amount = Number(this.state.expenseAmount);
    if (!amount) return;
    this.updateDB((db) => {
      db.expenses.push({
        id: Date.now().toString(),
        amount,
        category: this.state.expenseCategory,
        note: this.state.expenseNote,
        date: today()
      });
    });
    this.setState({ expenseAmount: "", expenseNote: "" });
  };

  addGoal = () => {
    const target = Number(this.state.goalTarget);
    if (!this.state.goalName || !target) return;
    this.updateDB((db) => {
      db.goals.push({
        id: Date.now().toString(),
        name: this.state.goalName,
        target,
        current: 0
      });
    });
    this.setState({ goalName: "", goalTarget: "" });
  };

  renderHeader() {
    const db = this.state.db;
    const month = new Intl.DateTimeFormat("ar-EG-u-ca-gregory", {
      month: "long",
      year: "numeric",
      calendar: "gregory"
    }).format(new Date());

    return h("header", null,
      h("div", { className: "top" },
        h("div", null,
          h("h1", null, "مالي V5 — Mohamed"),
          h("p", null, month)
        ),
        h("div", null,
          h("button", {
            className: "icon",
            onClick: () => this.updateDB(db2 => {
              db2.settings.theme = db2.settings.theme === "dark" ? "light" : "dark";
            })
          }, "◐"),
          " ",
          h("button", {
            className: "icon",
            onClick: () => db.settings.pin && this.setState({ locked: true })
          }, "🔒")
        )
      )
    );
  }

  renderNav() {
    const items = [
      ["home", "الرئيسية"],
      ["expenses", "المصروفات"],
      ["wealth", "الثروة"],
      ["goals", "الأهداف"],
      ["reports", "التقارير"],
      ["settings", "الإعدادات"]
    ];
    return h("nav", null, items.map(([id, label]) =>
      h("button", {
        key: id,
        className: this.state.page === id ? "active" : "",
        onClick: () => this.setPage(id)
      }, label)
    ));
  }

  getMetrics() {
    const db = this.state.db;
    const expenses = db.expenses.filter(x => monthKey(x.date) === monthKey());
    const spent = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const recordedIncome = db.incomes
      .filter(x => monthKey(x.date) === monthKey())
      .reduce((a, b) => a + Number(b.amount), 0);
    const income = recordedIncome || db.settings.salary;
    const net = db.settings.cash + db.settings.emergency +
      db.assets.gold + db.assets.silver + db.assets.investments -
      db.settings.debt;
    const budget = Object.values(db.budget).reduce((a, b) => a + Number(b), 0);
    const savings = income ? Math.max(0, (income - spent) / income) : 0;
    const debtScore = Math.max(0, 1 - db.settings.debt / Math.max(db.settings.salary, 1));
    const emergencyScore = db.settings.emergencyTarget
      ? Math.min(1, db.settings.emergency / db.settings.emergencyTarget) : 0;
    const investmentScore = Math.min(1, db.assets.investments / 100000);
    const score = Math.round((savings * .35 + debtScore * .30 +
      emergencyScore * .25 + investmentScore * .10) * 100);
    return { expenses, spent, income, net, budget, score };
  }

  renderHome() {
    const db = this.state.db;
    const m = this.getMetrics();
    const cards = [
      ["الدخل", m.income, "ريال"],
      ["المصروف", m.spent, "هذا الشهر"],
      ["المتبقي", m.income - m.spent, "ريال"],
      ["صافي الثروة", m.net, "ريال"]
    ];

    return h("div", { className: "page" },
      h("div", { className: "grid" }, cards.map((x, i) =>
        h("div", { className: "card kpi", key: i },
          h("span", null, x[0]),
          h("b", null, money(x[1])),
          h("small", null, x[2])
        )
      )),
      m.spent > m.budget
        ? h("div", { className: "alert bad" }, "تجاوزت الميزانية الشهرية.")
        : h("div", { className: "alert ok" }, "الميزانية تحت السيطرة."),
      db.settings.debt > 0
        ? h("div", { className: "alert" },
            "الأولوية الحالية: سداد الدين المتبقي ", money(db.settings.debt), " ريال.")
        : null,
      h("div", { className: "card" },
        h("div", { className: "sh" },
          h("h2", null, "Financial Score"),
          h("span", { className: "pill" }, "من 100")
        ),
        h("div", { className: "score" }, m.score),
        h("div", { className: "muted" }, "الادخار، الدين، الطوارئ والاستثمار")
      ),
      h("div", { className: "card" },
        h("div", { className: "sh" },
          h("h2", null, "الأهداف"),
          h("button", { className: "secondary", onClick: () => this.setPage("goals") }, "إدارة")
        ),
        db.goals.map(g => {
          const p = Math.min(100, (Number(g.current) / Math.max(Number(g.target), 1)) * 100);
          return h("div", { key: g.id, style: { margin: "12px 0" } },
            h("div", null,
              h("b", null, g.name),
              h("span", { style: { float: "left" } }, p.toFixed(1), "%")
            ),
            h("div", { className: "progress" },
              h("i", { style: { width: p + "%" } })
            )
          );
        })
      )
    );
  }

  renderExpenses() {
    const db = this.state.db;
    return h("div", { className: "page" },
      h("div", { className: "card" },
        h("h2", null, "إضافة مصروف"),
        h("label", null, "المبلغ"),
        h("input", {
          type: "number",
          value: this.state.expenseAmount,
          onChange: e => this.setState({ expenseAmount: e.target.value })
        }),
        h("label", null, "الفئة"),
        h("select", {
          value: this.state.expenseCategory,
          onChange: e => this.setState({ expenseCategory: e.target.value })
        }, Object.keys(db.budget).map(x => h("option", { key: x }, x))),
        h("label", null, "ملاحظة"),
        h("input", {
          value: this.state.expenseNote,
          onChange: e => this.setState({ expenseNote: e.target.value })
        }),
        h("button", { className: "primary", onClick: this.addExpense }, "حفظ")
      ),
      h("div", { className: "card" },
        h("h2", null, "آخر العمليات"),
        db.expenses.length
          ? db.expenses.slice().reverse().slice(0, 30).map(x =>
              h("div", { className: "tx", key: x.id },
                h("div", null,
                  h("b", null, x.category),
                  h("div", { className: "muted" }, x.date, " ", x.note || "")
                ),
                h("b", null, money(x.amount), " ريال")
              )
            )
          : h("div", { className: "muted" }, "لا توجد عمليات")
      )
    );
  }

  renderWealth() {
    const db = this.state.db;
    const cards = [
      ["الكاش", db.settings.cash],
      ["الطوارئ", db.settings.emergency],
      ["الذهب والفضة", db.assets.gold + db.assets.silver],
      ["الاستثمارات", db.assets.investments]
    ];
    return h("div", { className: "page" },
      h("div", { className: "grid" }, cards.map((x, i) =>
        h("div", { className: "card kpi", key: i },
          h("span", null, x[0]),
          h("b", null, money(x[1]))
        )
      )),
      h("div", { className: "card" },
        h("h2", null, "تحديث الأصول"),
        ["cash", "emergency"].map(k =>
          h("div", { key: k },
            h("label", null, k === "cash" ? "الكاش" : "احتياطي الطوارئ"),
            h("input", {
              type: "number",
              value: db.settings[k],
              onChange: e => this.updateDB(d => d.settings[k] = Number(e.target.value))
            })
          )
        ),
        ["gold", "silver", "investments"].map(k =>
          h("div", { key: k },
            h("label", null, { gold: "قيمة الذهب", silver: "قيمة الفضة", investments: "الاستثمارات" }[k]),
            h("input", {
              type: "number",
              value: db.assets[k],
              onChange: e => this.updateDB(d => d.assets[k] = Number(e.target.value))
            })
          )
        )
      )
    );
  }

  renderGoals() {
    const db = this.state.db;
    return h("div", { className: "page" },
      h("div", { className: "card" },
        h("h2", null, "إضافة هدف"),
        h("label", null, "اسم الهدف"),
        h("input", {
          value: this.state.goalName,
          onChange: e => this.setState({ goalName: e.target.value })
        }),
        h("label", null, "المبلغ المستهدف"),
        h("input", {
          type: "number",
          value: this.state.goalTarget,
          onChange: e => this.setState({ goalTarget: e.target.value })
        }),
        h("button", { className: "primary", onClick: this.addGoal }, "إضافة")
      ),
      h("div", { className: "card" },
        db.goals.map(g =>
          h("div", { className: "tx", key: g.id },
            h("div", null,
              h("b", null, g.name),
              h("div", { className: "muted" }, money(g.current), " / ", money(g.target))
            ),
            h("input", {
              style: { width: "110px" },
              type: "number",
              value: g.current,
              onChange: e => this.updateDB(d => {
                const item = d.goals.find(x => x.id === g.id);
                if (item) item.current = Number(e.target.value);
              })
            })
          )
        )
      )
    );
  }

  renderReports() {
    const m = this.getMetrics();
    return h("div", { className: "page" },
      h("div", { className: "card" },
        h("h2", null, "ملخص الشهر"),
        h("div", { className: "tx" }, h("span", null, "الدخل"), h("b", null, money(m.income))),
        h("div", { className: "tx" }, h("span", null, "المصروف"), h("b", null, money(m.spent))),
        h("div", { className: "tx" }, h("span", null, "الادخار"), h("b", null, money(m.income - m.spent))),
        h("button", { className: "primary", onClick: () => window.print() }, "حفظ PDF")
      )
    );
  }

  renderSettings() {
    const db = this.state.db;
    return h("div", { className: "page" },
      h("div", { className: "card" },
        h("h2", null, "الإعدادات الأساسية"),
        h("label", null, "الراتب"),
        h("input", {
          type: "number",
          value: db.settings.salary,
          onChange: e => this.updateDB(d => d.settings.salary = Number(e.target.value))
        }),
        h("label", null, "الدين"),
        h("input", {
          type: "number",
          value: db.settings.debt,
          onChange: e => this.updateDB(d => d.settings.debt = Number(e.target.value))
        }),
        h("label", null, "هدف الطوارئ"),
        h("input", {
          type: "number",
          value: db.settings.emergencyTarget,
          onChange: e => this.updateDB(d => d.settings.emergencyTarget = Number(e.target.value))
        })
      ),
      h("div", { className: "card" },
        h("h2", null, "الحماية"),
        h("p", { className: "muted" }, "ضع PIN من 4 إلى 6 أرقام، ثم اضغط علامة القفل أعلى التطبيق."),
        h("input", {
          type: "password",
          inputMode: "numeric",
          maxLength: 6,
          value: this.state.newPin,
          onChange: e => this.setState({ newPin: e.target.value })
        }),
        h("button", {
          className: "primary",
          onClick: () => {
            const p = this.state.newPin;
            if (p && !/^\d{4,6}$/.test(p)) return alert("PIN من 4 إلى 6 أرقام");
            this.updateDB(d => d.settings.pin = p);
            this.setState({ newPin: "" });
            alert("تم حفظ PIN");
          }
        }, "حفظ PIN"),
        db.settings.pin
          ? h("button", {
              className: "danger",
              style: { width: "100%", marginTop: "8px" },
              onClick: () => this.updateDB(d => d.settings.pin = "")
            }, "إلغاء PIN")
          : null
      )
    );
  }

  renderPage() {
    switch (this.state.page) {
      case "expenses": return this.renderExpenses();
      case "wealth": return this.renderWealth();
      case "goals": return this.renderGoals();
      case "reports": return this.renderReports();
      case "settings": return this.renderSettings();
      default: return this.renderHome();
    }
  }

  render() {
    return h(React.Fragment, null,
      this.state.locked
        ? h("div", { className: "lock" },
            h("div", { className: "lockbox" },
              h("h2", null, "🔐 مالي V5"),
              h("p", { className: "muted" }, "أدخل PIN"),
              h("input", {
                type: "password",
                inputMode: "numeric",
                value: this.state.pinInput,
                onChange: e => this.setState({ pinInput: e.target.value })
              }),
              h("button", { className: "primary", onClick: this.unlock }, "فتح")
            )
          )
        : null,
      this.renderHeader(),
      h("main", null, this.renderPage()),
      this.renderNav()
    );
  }
}

ReactDOM.render(h(App), document.getElementById("root"));
