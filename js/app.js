
/* Club Fantasy MX - demo front-end (sin backend) */
const STORAGE_KEYS = {
  CART: "cfmx_cart",
  ORDERS: "cfmx_orders",
  LAST_QUOTE: "cfmx_last_quote"
};

const sampleProducts = [
  {id:"CF-001", team:"Real Madrid", name:"Local 24/25", price:999, sizes:["CH","M","G","XG"], stock:12},
  {id:"CF-002", team:"Barcelona", name:"Visita 24/25", price:999, sizes:["CH","M","G","XG"], stock:9},
  {id:"CF-003", team:"Manchester City", name:"Local 24/25", price:899, sizes:["CH","M","G","XG"], stock:15},
  {id:"CF-004", team:"PSG", name:"Tercera 24/25", price:949, sizes:["CH","M","G","XG"], stock:6},
  {id:"CF-005", team:"América", name:"Local 24/25", price:799, sizes:["CH","M","G","XG"], stock:20},
  {id:"CF-006", team:"Chivas", name:"Visita 24/25", price:799, sizes:["CH","M","G","XG"], stock:18},
  {id:"CF-007", team:"Argentina", name:"Edición Especial", price:1199, sizes:["CH","M","G","XG"], stock:5},
  {id:"CF-008", team:"México", name:"Edición Especial", price:1099, sizes:["CH","M","G","XG"], stock:7},
];

function money(n){ return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(n); }

function readJson(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; }
}
function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function getCart(){ return readJson(STORAGE_KEYS.CART, []); }
function setCart(cart){ writeJson(STORAGE_KEYS.CART, cart); updateCartBadge(); }

function updateCartBadge(){
  const cart = getCart();
  const count = cart.reduce((a,i)=>a+(i.qty||1),0);
  document.querySelectorAll("[data-cart-badge]").forEach(el=> el.textContent = count);
}

function addToCart(productId, size, qty=1){
  const cart = getCart();
  const key = `${productId}::${size}`;
  const idx = cart.findIndex(i => i.key === key);
  if(idx>=0){ cart[idx].qty += qty; }
  else{
    const p = sampleProducts.find(x=>x.id===productId);
    cart.push({ key, id: productId, team: p.team, name: p.name, price: p.price, size, qty });
  }
  setCart(cart);
}

function removeFromCart(key){
  const cart = getCart().filter(i => i.key !== key);
  setCart(cart);
}

function clearCart(){ setCart([]); }

function cartTotals(){
  const cart = getCart();
  const subtotal = cart.reduce((a,i)=>a+(i.price*i.qty),0);
  const envio = subtotal>0 ? 99 : 0; // demo
  const total = subtotal + envio;
  return {subtotal, envio, total};
}

function renderCatalog(){
  const grid = document.getElementById("catalogGrid");
  if(!grid) return;

  grid.innerHTML = sampleProducts.map(p => {
    const sizeOpts = p.sizes.map(s=>`<option value="${s}">${s}</option>`).join("");
    return `
      <div class="col">
        <div class="card h-100 p-2">
          <div class="img-placeholder mb-3">PLAYERA ${p.team}</div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <h5 class="card-title mb-1">${p.team}</h5>
                <div class="small-muted">${p.name} · <span class="badge badge-soft">${p.id}</span></div>
              </div>
              <div class="fw-semibold">${money(p.price)}</div>
            </div>

            <div class="mt-3 d-flex gap-2">
              <select class="form-select form-select-sm" id="size-${p.id}" aria-label="Talla">
                ${sizeOpts}
              </select>
              <input class="form-control form-control-sm" id="qty-${p.id}" type="number" min="1" value="1" style="max-width:100px" aria-label="Cantidad">
            </div>

            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-primary w-100" data-add="${p.id}">Comprar / Apartar</button>
              <button class="btn btn-outline-light" data-desc="${p.id}">Descripción</button>
            </div>

            <div class="small-muted mt-3">Stock: <b>${p.stock}</b></div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-add");
      const size = document.getElementById(`size-${id}`).value;
      const qty = Math.max(1, parseInt(document.getElementById(`qty-${id}`).value || "1",10));
      addToCart(id, size, qty);
      toast(`Agregado al carrito: ${id} · Talla ${size} · x${qty}`);
    });
  });

  grid.querySelectorAll("[data-desc]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-desc");
      const p = sampleProducts.find(x=>x.id===id);
      const modalTitle = document.getElementById("descModalLabel");
      const modalBody = document.getElementById("descModalBody");
      modalTitle.textContent = `${p.team} — ${p.name}`;
      modalBody.innerHTML = `
        <p class="mb-1"><span class="badge badge-soft">${p.id}</span> · ${money(p.price)}</p>
        <p class="small-muted mb-0">
          Playera ${p.name} del equipo ${p.team}. Disponible en tallas ${p.sizes.join(", ")}.
          Este catálogo es una demostración del proyecto (sin pagos en línea).
        </p>
      `;
      const modal = new bootstrap.Modal(document.getElementById("descModal"));
      modal.show();
    });
  });
}

function renderCart(){
  const tbody = document.getElementById("cartBody");
  if(!tbody) return;
  const cart = getCart();
  if(cart.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" class="small-muted">Tu carrito está vacío. Ve a <a href="catalogo.html">Catálogo</a>.</td></tr>`;
  } else {
    tbody.innerHTML = cart.map((i, idx)=>`
      <tr>
        <td>${idx+1}</td>
        <td><b>${i.team}</b><div class="small-muted">${i.name} · <span class="badge badge-soft">${i.id}</span></div></td>
        <td>${i.size}</td>
        <td>${i.qty}</td>
        <td>${money(i.price * i.qty)}</td>
        <td><button class="btn btn-sm btn-outline-light" data-remove="${i.key}">Quitar</button></td>
      </tr>
    `).join("");
  }

  const totals = cartTotals();
  document.getElementById("subtotal").textContent = money(totals.subtotal);
  document.getElementById("envio").textContent = money(totals.envio);
  document.getElementById("total").textContent = money(totals.total);

  tbody.querySelectorAll("[data-remove]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      removeFromCart(btn.getAttribute("data-remove"));
      renderCart();
      toast("Producto eliminado del carrito");
    });
  });

  const clearBtn = document.getElementById("clearCart");
  if(clearBtn){
    clearBtn.addEventListener("click", ()=>{
      clearCart();
      renderCart();
      toast("Carrito vaciado");
    });
  }
}

function handleQuote(){
  const form = document.getElementById("quoteForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const qty = Math.max(1, parseInt(data.cantidad || "1",10));
    const base = 799;
    const personalizacion = data.personalizacion === "si" ? 150 : 0;
    const urgente = data.entrega === "48h" ? 120 : 0;
    const total = (base + personalizacion + urgente) * qty;
    writeJson(STORAGE_KEYS.LAST_QUOTE, { ...data, total, at: new Date().toISOString() });

    const out = document.getElementById("quoteOut");
    out.innerHTML = `
      <div class="card p-3 mt-3">
        <div class="d-flex justify-content-between align-items-center">
          <div><b>Cotización estimada</b><div class="small-muted">Se envía al administrador como demostración.</div></div>
          <span class="badge badge-soft">${money(total)}</span>
        </div>
        <hr class="border border-white border-opacity-10">
        <div class="small-muted">
          Cliente: <b>${escapeHtml(data.nombre)}</b> · Tel: <b>${escapeHtml(data.telefono)}</b><br>
          Playera: <b>${escapeHtml(data.playera)}</b> · Talla: <b>${escapeHtml(data.talla)}</b> · Cantidad: <b>${qty}</b><br>
          Personalización: <b>${data.personalizacion === "si" ? "Sí" : "No"}</b> · Entrega: <b>${escapeHtml(data.entrega)}</b>
        </div>
      </div>
    `;
    toast("Cotización generada (demo)");
  });
}

function handleOrder(){
  const form = document.getElementById("orderForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const terms = document.getElementById("terms");
    if(terms && !terms.checked){
      toast("Debes aceptar términos y condiciones.");
      return;
    }

    const cart = getCart();
    if(cart.length === 0){
      toast("Agrega productos al carrito antes de enviar el pedido.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const folio = `CFMX-${Math.floor(Math.random()*90000+10000)}`;
    const totals = cartTotals();

    const order = {
      folio,
      status: "pendiente",
      createdAt: new Date().toISOString(),
      customer: {
        nombre: data.nombre,
        telefono: data.telefono,
        correo: data.correo,
        direccion: data.direccion,
        entrega: data.entrega
      },
      items: cart,
      totals
    };

    const orders = readJson(STORAGE_KEYS.ORDERS, []);
    orders.unshift(order);
    writeJson(STORAGE_KEYS.ORDERS, orders);

    clearCart();
    renderCart();
    toast(`Pedido registrado. Folio: ${folio}`);

    const out = document.getElementById("orderOut");
    if(out){
      out.innerHTML = `
        <div class="card p-3 mt-3">
          <div class="d-flex justify-content-between align-items-center">
            <div><b>Pedido enviado</b><div class="small-muted">Confirmación simulada (sin correo real).</div></div>
            <span class="badge badge-soft">${folio}</span>
          </div>
          <hr class="border border-white border-opacity-10">
          <div class="small-muted">
            Total: <b>${money(totals.total)}</b> · Estatus: <b>pendiente</b><br>
            Nota: pago en sucursal o contra entrega (efectivo), según el alcance del proyecto.
          </div>
        </div>
      `;
    }
    form.reset();
  });
}

function renderAdmin(){
  const container = document.getElementById("adminOrders");
  if(!container) return;
  const orders = readJson(STORAGE_KEYS.ORDERS, []);
  if(orders.length === 0){
    container.innerHTML = `<div class="small-muted">No hay pedidos registrados (demo).</div>`;
    return;
  }

  container.innerHTML = orders.slice(0,10).map(o=>`
    <div class="card p-3 mb-3">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <div class="fw-semibold">Folio: ${o.folio} <span class="badge badge-soft ms-2">${o.status}</span></div>
          <div class="small-muted">${escapeHtml(o.customer.nombre)} · ${escapeHtml(o.customer.telefono)} · ${escapeHtml(o.customer.correo)}</div>
        </div>
        <div class="text-end">
          <div class="fw-semibold">${money(o.totals.total)}</div>
          <div class="small-muted">${new Date(o.createdAt).toLocaleString("es-MX")}</div>
        </div>
      </div>
      <hr class="border border-white border-opacity-10 my-2">
      <div class="small-muted">
        <b>Dirección:</b> ${escapeHtml(o.customer.direccion)}<br>
        <b>Entrega:</b> ${escapeHtml(o.customer.entrega)}
      </div>
      <div class="mt-2">
        <button class="btn btn-sm btn-outline-light" data-status="enviado" data-folio="${o.folio}">Marcar Enviado</button>
        <button class="btn btn-sm btn-outline-light" data-status="entregado" data-folio="${o.folio}">Marcar Entregado</button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll("[data-status]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const folio = btn.getAttribute("data-folio");
      const status = btn.getAttribute("data-status");
      const orders = readJson(STORAGE_KEYS.ORDERS, []);
      const idx = orders.findIndex(x=>x.folio===folio);
      if(idx>=0){
        orders[idx].status = status;
        writeJson(STORAGE_KEYS.ORDERS, orders);
        renderAdmin();
        toast(`Estatus actualizado: ${folio} → ${status}`);
      }
    });
  });
}

function toast(message){
  const wrap = document.getElementById("toastWrap");
  if(!wrap){
    alert(message);
    return;
  }
  const id = "t"+Math.random().toString(36).slice(2);
  const el = document.createElement("div");
  el.className = "toast align-items-center text-bg-primary border-0";
  el.id = id;
  el.role = "alert";
  el.ariaLive = "assertive";
  el.ariaAtomic = "true";
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  wrap.appendChild(el);
  const t = new bootstrap.Toast(el, {delay: 2400});
  t.show();
  el.addEventListener("hidden.bs.toast", ()=> el.remove());
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

document.addEventListener("DOMContentLoaded", ()=>{
  updateCartBadge();
  renderCatalog();
  renderCart();
  handleQuote();
  handleOrder();
  renderAdmin();
});
