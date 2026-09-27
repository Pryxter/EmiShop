# EMI Shop

Sistema de inventario y ventas en español, creado con React y Vite.

## Ejecutar

```sh
npm install
npm run dev
```

Abre la dirección que muestra Vite. Para producción: `npm run build`. Para verificar la lógica: `npm test`.

## Funciones

- Registro de marca o nombre, tipo de prenda, cantidad y precios unitarios de compra y venta.
- Búsqueda, filtros de categoría y disponibilidad, y reposición de existencias.
- Botón Vendida con selección de cantidad cuando existe más de una unidad.
- Descuento automático de stock, registro por día, ventas mensuales y ganancia estimada.
- Anulación de ventas erróneas con devolución al inventario.
- Registro de gastos pagados: conserje, pasajes, comida, pago de trabajadoras, servicios, alquiler y otros; descripción, monto y fecha del pago.
- Historial de gastos por mes, día y categoría, con totales y anulación que conserva el registro sin descontarlo del balance.
- Ganancia después de gastos = ventas − costo de prendas vendidas − gastos no anulados del período. Puede ser negativa. Los respaldos anteriores se cargan con una lista de gastos vacía y los nuevos incluyen el historial completo.
- Respaldos JSON con importación validada y confirmación antes de reemplazar datos.
- Moneda configurable (USD inicialmente); cambiarla no convierte los importes.

## Almacenamiento de prueba

Los datos se guardan en localStorage del navegador y origen actual. No se comparten entre dispositivos, perfiles, puertos o navegadores. Borrar los datos del navegador borra el inventario; exporta respaldos regularmente. No hay base de datos ni servidor de datos.

Los importes se calculan en centavos para evitar errores de redondeo. Las ventas guardan una copia de los precios y el nombre al vender. Los días se calculan con la fecha local del dispositivo. Las ventas acumuladas representan ingresos, no saldo de caja: la ganancia neta descuenta el costo de las prendas vendidas y los gastos registrados no anulados del período. El inventario comienza vacío, sin ventas ficticias.

La reposición mantiene el costo de la referencia. Cuando llegue un lote con costo distinto, créalo como una nueva prenda para preservar el cálculo de ganancias.

