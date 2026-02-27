// ---------------- REGISTRAR COMPRA ----------------
async function comprarProducto() {

let nombre = document.getElementById("nombreProducto").value.trim().toLowerCase();
let cantidad = Number(document.getElementById("cantidadCompra").value);
let costo = Number(document.getElementById("costoCompra").value);
let precioVenta = Number(document.getElementById("precioVenta").value);

if(!nombre || cantidad<=0) return alert("Completa los datos");

let { data: prod } = await supabase
.from("productos")
.select("*")
.eq("nombre", nombre)
.single();

if(!prod){

let { data:newProd } = await supabase
.from("productos")
.insert({
nombre,
stock:cantidad,
costo_promedio:costo,
precio_venta:precioVenta
})
.select()
.single();

prod=newProd;

}else{

await supabase
.from("productos")
.update({
stock:prod.stock+cantidad,
precio_venta:precioVenta
})
.eq("id", prod.id);
}

await supabase.from("movimientos").insert({
producto_id:prod.id,
tipo:"compra",
cantidad,
costo_unitario:costo,
precio_venta:precioVenta
});

mostrarProductos();
}

// ---------------- REGISTRAR VENTA ----------------
async function venderProducto(){

let nombre=document.getElementById("productoVenta").value.trim().toLowerCase();
let cantidad=Number(document.getElementById("cantidadVenta").value);

let { data:prod } = await supabase
.from("productos")
.select("*")
.eq("nombre", nombre)
.single();

if(!prod || prod.stock<cantidad) return alert("Stock insuficiente");

await supabase
.from("productos")
.update({stock:prod.stock-cantidad})
.eq("id", prod.id);

await supabase.from("movimientos").insert({
producto_id:prod.id,
tipo:"venta",
cantidad,
precio_venta:prod.precio_venta,
costo_unitario:prod.costo_promedio
});

mostrarProductos();
}

// ---------------- ELIMINAR ----------------
async function eliminarProducto(id){
if(!confirm("¿Eliminar producto?")) return;

await supabase.from("productos").delete().eq("id",id);
mostrarProductos();
}

// ---------------- MOSTRAR ----------------
async function mostrarProductos(){

let { data:productos } = await supabase
.from("productos")
.select("*")
.order("nombre");

let lista=document.getElementById("listaProductos");
lista.innerHTML="";

let ingresoMes=0;
let gastoMes=0;

for(let prod of productos){

let { data:movs } = await supabase
.from("movimientos")
.select("*")
.eq("producto_id", prod.id);

let ingreso=0;
let gasto=0;

movs.forEach(m=>{
if(m.tipo==="venta"){
ingreso+=m.cantidad*m.precio_venta;
gasto+=m.cantidad*m.costo_unitario;
}else{
gasto+=m.cantidad*m.costo_unitario;
}
});

ingresoMes+=ingreso;
gastoMes+=gasto;

let ganancia=ingreso-gasto;

lista.innerHTML+=`
<div class="producto">
<b>${prod.nombre.toUpperCase()}</b><br>
Stock: ${prod.stock}<br>
Precio: $${prod.precio_venta}<br>
Ingresos: $${ingreso.toFixed(2)}<br>
Gastos: $${gasto.toFixed(2)}<br>
Ganancia: $${ganancia.toFixed(2)}
<button class="btn-eliminar" onclick="eliminarProducto('${prod.id}')">Eliminar</button>
</div>
`;
}

document.getElementById("ingresoMes").textContent=ingresoMes.toFixed(2);
document.getElementById("gastoMes").textContent=gastoMes.toFixed(2);
document.getElementById("gananciaMes").textContent=(ingresoMes-gastoMes).toFixed(2);
}

document.getElementById("buscador").addEventListener("input",mostrarProductos);

mostrarProductos();