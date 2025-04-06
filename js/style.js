const form = document.getElementById("form-transacao")
const dataInput = document.getElementById("data")
const descInput = document.getElementById("descricao")
const tipoInput = document.getElementById("tipo")
const valorInput = document.getElementById("valor")
const categoriaInput = document.getElementById("categoria")
const lista = document.getElementById("lista-transacoes")
const receitasEl = document.getElementById("total-receitas")
const despesasEl = document.getElementById("total-despesas")
const saldoEl = document.getElementById("saldo")
const filtroMes = document.getElementById("filtro-mes")

let transacoes = JSON.parse(localStorage.getItem("transacoes")) || []

form.addEventListener("submit", function (e) {
  e.preventDefault()

  const nova = {
    id: Date.now(),
    data: dataInput.value,
    descricao: descInput.value,
    tipo: tipoInput.value,
    valor: parseFloat(valorInput.value.replace(",", ".")), // aceitar vírgula
    categoria: categoriaInput.value
  }

  transacoes.push(nova)
  save()
  render()
  update()
  form.reset()
})

function save() {
  transacoes.sort((a, b) => new Date(b.data) - new Date(a.data)) // organiza por data
  localStorage.setItem("transacoes", JSON.stringify(transacoes))
}

function deletar(id) {
  if (confirm("Tem certeza que deseja deletar?")) {
    transacoes = transacoes.filter((t) => t.id !== id)
    save()
    render()
    update()
  }
}

function render() {
  lista.innerHTML = ""
  const mesSelecionado = filtroMes.value

  const transacoesFiltradas = mesSelecionado
    ? transacoes.filter((t) => t.data.slice(0, 7) === mesSelecionado)
    : transacoes

  // ordena por data (mais recente primeiro)
  transacoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data))

  transacoesFiltradas.forEach((t) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${t.data}</td>
      <td>${t.descricao}</td>
      <td>${t.categoria}</td>
      <td class="${t.tipo}">${t.tipo}</td>
      <td class="${t.tipo}">R$ ${t.valor.toFixed(2)}</td>
      <td><button class="btn-delete" onclick="deletar(${t.id})">Deletar</button></td>
    `
    lista.appendChild(tr)
  })
}

filtroMes.addEventListener("change", () => {
  render()
  update()
})

function update() {
  const mesSelecionado = filtroMes.value
  const transacoesFiltradas = mesSelecionado
    ? transacoes.filter((t) => t.data.slice(0, 7) === mesSelecionado)
    : transacoes

  const receitas = transacoesFiltradas
    .filter((t) => t.tipo === "receita")
    .reduce((a, b) => a + b.valor, 0)

  const despesas = transacoesFiltradas
    .filter((t) => t.tipo === "despesa")
    .reduce((a, b) => a + b.valor, 0)

  const saldo = receitas - despesas

  receitasEl.textContent = receitas.toFixed(2)
  despesasEl.textContent = despesas.toFixed(2)
  saldoEl.textContent = saldo.toFixed(2)

  atualizarGraficoPizza(receitas, despesas)
  atualizarGraficoBarra(transacoesFiltradas)
}

let graficoPizza, graficoBarra

function atualizarGraficoPizza(receitas, despesas) {
  const ctx = document.getElementById("grafico-pizza").getContext("2d")
  if (graficoPizza) graficoPizza.destroy()
  graficoPizza = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [
        {
          data: [receitas, despesas],
          backgroundColor: ["#d9f612", "#161616"]
        }
      ]
    }
  })
}

function atualizarGraficoBarra(transacoesFiltradas) {
  const ctx = document.getElementById("grafico-barra").getContext("2d")
  if (graficoBarra) graficoBarra.destroy()

  const categorias = {}
  transacoesFiltradas.forEach((t) => {
    if (!categorias[t.categoria]) categorias[t.categoria] = 0
    categorias[t.categoria] += t.valor
  })

  graficoBarra = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(categorias),
      datasets: [
        {
          label: "Gastos por Categoria",
          data: Object.values(categorias),
          backgroundColor: "#2196f3"
        }
      ]
    }
  })
}

document.getElementById("exportar-pdf").addEventListener("click", () => {
  const elemento = document.getElementById("relatorio")
  html2pdf().from(elemento).save("relatorio.pdf")
})

render()
update()
