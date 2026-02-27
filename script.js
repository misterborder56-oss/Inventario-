// ---------------- REGISTRAR COMPRA ----------------
async function comprarProducto(){

let nombre=document.getElementById("nombreProducto").value.trim().toLowerCase();
let cantidad=Number(document.getElementById("cantidadCompra").value);
let costo=Number(document.getElementById("costoCompra").value);
let precioVenta=Number(document.getElementById("precioVenta").value);

if(!nombre || cantidad<=0 || costo<=0) return alert("Datos incorrectos");

let { data:prod } = await supabase
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
costo_promedio:costo,
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

// ---------------- MOSTRAR PRODUCTOS ----------------
async function mostrarProductos(){

let { data:productos } = await supabase
.from("productos")
.select("*")
.order("nombre");

let lista=document.getElementById("listaProductos");
lista.innerHTML="";

let ingresoMes=0;
let costoVendidoMes=0;
let inventarioInvertidoMes=0;

let filtro=document.getElementById("buscador").value.toLowerCase();

for(let prod of productos){

if(!prod.nombre.includes(filtro)) continue;

let { data:movs } = await supabase
.from("movimientos")
.select("*")
.eq("producto_id", prod.id);

let ingreso=0;
let costoVendido=0;
let totalComprado=0;

// recorrer movimientos
movs.forEach(m=>{

if(m.tipo==="venta"){
ingreso += m.cantidad * m.precio_venta;
costoVendido += m.cantidad * m.costo_unitario;
}

if(m.tipo==="compra"){
totalComprado += m.cantidad * m.costo_unitario;
}

});

// Inventario invertido = lo comprado - lo ya vendido
let inventarioInvertido = totalComprado - costoVendido;

let gastoTotalProducto = costoVendido + inventarioInvertido;

let ganancia=ingreso-costoVendido;
let margen= ingreso>0 ? ((ganancia/ingreso)*100).toFixed(2) : 0;

ingresoMes+=ingreso;
costoVendidoMes+=costoVendido;
inventarioInvertidoMes+=inventarioInvertido;

lista.innerHTML+=`
<div class="producto">
<b>${prod.nombre.toUpperCase()}</b><br>
Stock: ${prod.stock}<br>
Precio venta: $${prod.precio_venta}<br>
Ingresos: $${ingreso.toFixed(2)}<br>
Costo vendido: $${costoVendido.toFixed(2)}<br>
Inventario invertido: $${inventarioInvertido.toFixed(2)}<br>
Gasto total invertido: $${gastoTotalProducto.toFixed(2)}<br>
Ganancia real: $${ganancia.toFixed(2)}<br>
Margen: ${margen}% 
<button class="btn-eliminar" onclick="eliminarProducto('${prod.id}')">Eliminar</button>
</div>
`;
}

let gastoTotalMes = costoVendidoMes + inventarioInvertidoMes;
let gananciaMes=ingresoMes-costoVendidoMes;
let margenMes= ingresoMes>0 ? ((gananciaMes/ingresoMes)*100).toFixed(2) : 0;

document.getElementById("ingresoMes").textContent=ingresoMes.toFixed(2);
document.getElementById("gastoMes").textContent=gastoTotalMes.toFixed(2);
document.getElementById("gananciaMes").textContent=gananciaMes.toFixed(2);
document.getElementById("margenMes").textContent=margenMes+"%";
}
mostrarProductos();
