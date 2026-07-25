import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDaHjcGh8YN7hMfi6fIV1D0C5GD-vAsClI",
  authDomain: "toxic-detailing.firebaseapp.com",
  projectId: "toxic-detailing",
  storageBucket: "toxic-detailing.firebasestorage.app",
  messagingSenderId: "828681320008",
  appId: "1:828681320008:web:ecc5a2774711528693ca7d",
  measurementId: "G-R644C2J8JE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let productosCache = [];
let carrito = [];
let isAdmin = false;

// ELEMENTOS DOM
const productsGrid = document.getElementById("products-grid");
const cartCount = document.getElementById("cart-count");
const floatingCartCount = document.getElementById("floating-cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartBtn = document.getElementById("cart-btn");
const floatingCart = document.getElementById("floating-cart");
const closeCart = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalPrice = document.getElementById("cart-total-price");
const checkoutBtn = document.getElementById("checkout-btn");
const emptyCartBtn = document.getElementById("empty-cart-btn");
const searchInput = document.getElementById("search-input");
const accountBtn = document.getElementById("account-btn");
const accountText = document.getElementById("account-text");
const accountMenu = document.getElementById("account-menu");
const logoutBtn = document.getElementById("logout-btn");

// AYUDA DOM
const helpSection = document.getElementById("ayuda");
const helpToggleBtn = document.getElementById("help-toggle-btn");
const floatingHelpBtn = document.getElementById("floating-help-btn");

// ADMIN DOM
const adminTriggerBtn = document.getElementById("admin-trigger-btn");
const adminPanel = document.getElementById("admin-panel");
const closeAdmin = document.getElementById("close-admin");
const addProductForm = document.getElementById("add-product-form");
const adminModalTitle = document.getElementById("admin-modal-title");
const editProductId = document.getElementById("edit-product-id");
const adminSubmitBtn = document.getElementById("admin-submit-btn");

// GESTIÓN DE USUARIOS / PERFILES
let usuarioActual = localStorage.getItem("toxic_user");
let rolActual = localStorage.getItem("toxic_rol");

if (usuarioActual) {
    accountText.textContent = usuarioActual;
    if (rolActual === "admin") {
        isAdmin = true;
        adminTriggerBtn.classList.remove("hidden");
    }
}

// Clic en Mi Cuenta
accountBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (usuarioActual) {
        accountMenu.classList.toggle("hidden");
        return;
    }

    const { value: nombre } = await Swal.fire({
        title: 'Iniciar Sesión',
        input: 'text',
        inputLabel: 'Ingresa tu nombre (ej: Pepito) o credencial de Admin',
        inputPlaceholder: 'Tu nombre...',
        showCancelButton: true,
        confirmButtonColor: '#39ff14',
        cancelButtonColor: '#333'
    });

    if (nombre) {
        if (nombre === "Admin2026") {
            const { value: pass } = await Swal.fire({
                title: 'Contraseña de Administrador',
                input: 'password',
                inputPlaceholder: 'Contraseña...',
                confirmButtonColor: '#39ff14'
            });
            if (pass === "ADMINADMIN2026") {
                isAdmin = true;
                rolActual = "admin";
                usuarioActual = "Administrador";
                localStorage.setItem("toxic_user", usuarioActual);
                localStorage.setItem("toxic_rol", "admin");
                accountText.textContent = usuarioActual;
                adminTriggerBtn.classList.remove("hidden");
                Swal.fire('¡Bienvenido Administrador!', 'Acceso completo al panel y edición de productos.', 'success');
                cargarProductos();
            } else {
                Swal.fire('Error', 'Contraseña incorrecta', 'error');
            }
        } else {
            usuarioActual = nombre;
            rolActual = "cliente";
            localStorage.setItem("toxic_user", nombre);
            localStorage.setItem("toxic_rol", "cliente");
            accountText.textContent = nombre;
            Swal.fire('¡Bienvenido!', `Hola ${nombre}, ya puedes navegar y comprar sin problema.`, 'success');
        }
    }
});

// Cerrar sesión
logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    usuarioActual = null;
    rolActual = null;
    isAdmin = false;
    accountText.textContent = "Mi cuenta";
    accountMenu.classList.add("hidden");
    adminTriggerBtn.classList.add("hidden");
    Swal.fire('Sesión cerrada', 'Has salido del usuario correctamente', 'info');
    cargarProductos();
});

// MOSTRAR/OCULTAR SECCIÓN AYUDA
[helpToggleBtn, floatingHelpBtn].forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        helpSection.classList.remove("hidden");
        helpSection.scrollIntoView({ behavior: 'smooth' });
    });
});

// CARGAR PRODUCTOS DE FIREBASE
async function cargarProductos() {
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        productosCache = [];
        querySnapshot.forEach((docSnap) => {
            productosCache.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (productosCache.length === 0) {
            productosCache = [
                { id: "1", nombre: "THE BOSS SHINE 600ml + Gatillo", precio: 9000, imagen: "https://i.ibb.co/3s32J3K/172333.jpg", descripcion: "Cera líquida en spray formulada a base de polímeros y sílice." },
                { id: "2", nombre: "GEL SHINE 600ml + Pico", precio: 25000, imagen: "https://i.ibb.co/3s32J3K/172333.jpg", descripcion: "Acondicionador de cubiertas y plásticos exteriores." }
            ];
        }

        mostrarProductos(productosCache);
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// RENDERIZAR PRODUCTOS
function mostrarProductos(productos) {
    productsGrid.innerHTML = "";
    productos.forEach(prod => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        
        let adminAcciones = "";
        if (isAdmin) {
            adminAcciones = `
                <div class="admin-card-actions">
                    <button class="edit-product-btn" data-id="${prod.id}" title="Editar producto"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-product-btn" data-id="${prod.id}" title="Eliminar producto"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }

        card.innerHTML = `
            ${adminAcciones}
            <div class="product-img-box" data-id="${prod.id}">
                <img src="${prod.imagen}" alt="${prod.nombre}">
            </div>
            <div class="product-info">
                <div class="product-title">${prod.nombre}</div>
                <div class="product-price">$${prod.precio.toLocaleString()}</div>
            </div>
            <div class="product-buttons">
                <button class="btn-view" data-id="${prod.id}">VER</button>
                <button class="btn-buy" data-id="${prod.id}">COMPRAR</button>
            </div>
        `;
        productsGrid.appendChild(card);
    });

    document.querySelectorAll(".btn-view, .product-img-box").forEach(el => {
        el.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id") || e.currentTarget.closest(".product-card").querySelector(".btn-view").getAttribute("data-id");
            abrirModal(id, productos);
        });
    });

    document.querySelectorAll(".btn-buy").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            agregarAlCarrito(id);
        });
    });

    if (isAdmin) {
        document.querySelectorAll(".delete-product-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.getAttribute("data-id");
                const confirm = await Swal.fire({ title: '¿Eliminar producto?', showCancelButton: true, confirmButtonColor: '#ff3333' });
                if (confirm.isConfirmed) {
                    await deleteDoc(doc(db, "productos", id));
                    Swal.fire('Eliminado', 'El producto fue borrado', 'success');
                    cargarProductos();
                }
            });
        });

        document.querySelectorAll(".edit-product-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.getAttribute("data-id");
                const prod = productosCache.find(p => p.id === id);
                if (prod) {
                    editProductId.value = prod.id;
                    document.getElementById("new-name").value = prod.nombre;
                    document.getElementById("new-price").value = prod.precio;
                    document.getElementById("new-desc").value = prod.descripcion;
                    adminModalTitle.textContent = "Editar Producto ✏️";
                    adminSubmitBtn.textContent = "Actualizar Producto";
                    adminPanel.classList.remove("hidden");
                }
            });
        });
    }
}

// BUSCADOR
searchInput.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = productosCache.filter(p => p.nombre.toLowerCase().includes(texto));
    mostrarProductos(filtrados);
});

// CARRITO
function agregarAlCarrito(id) {
    const producto = productosCache.find(p => p.id === id);
    if (!producto) return;

    const enCarrito = carrito.find(item => item.id === id);
    if (enCarrito) {
        enCarrito.cantidad++;
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'El producto ya está en el carrito (se sumó una unidad)', showConfirmButton: false, timer: 2000 });
    } else {
        carrito.push({ ...producto, cantidad: 1 });
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto agregado al carrito', showConfirmButton: false, timer: 2000 });
    }
    actualizarCarrito();
}

function actualizarCarrito() {
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    cartCount.textContent = totalItems;
    floatingCartCount.textContent = totalItems;

    cartItemsContainer.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
        total += item.precio * item.cantidad;
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <div>
                <strong>${item.nombre}</strong>
                <div>$${item.precio.toLocaleString()} x ${item.cantidad}</div>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalPrice.textContent = `$${total.toLocaleString()}`;
}

[cartBtn, floatingCart].forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        cartSidebar.classList.remove("hidden");
    });
});

closeCart.addEventListener("click", () => cartSidebar.classList.add("hidden"));

emptyCartBtn.addEventListener("click", () => {
    carrito = [];
    actualizarCarrito();
    Swal.fire('Vaciado', 'El carrito está vacío', 'info');
});

checkoutBtn.addEventListener("click", () => {
    if (carrito.length === 0) {
        Swal.fire('Atención', 'El carrito está vacío', 'warning');
        return;
    }
    let mensaje = "Hola! Quiero realizar el siguiente pedido en Toxic Detailing:\n\n";
    let total = 0;
    carrito.forEach(item => {
        mensaje += `- ${item.nombre} x${item.cantidad} ($${(item.precio * item.cantidad).toLocaleString()})\n`;
        total += item.precio * item.cantidad;
    });
    mensaje += `\nTotal a pagar: $${total.toLocaleString()}`;

    window.open(`https://wa.me/5491134984283?text=${encodeURIComponent(mensaje)}`, "_blank");
});

// MODAL DETALLE
const modal = document.getElementById("product-modal");
const closeModal = document.querySelector(".close-modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalPrice = document.getElementById("modal-price");
const modalDesc = document.getElementById("modal-desc");
const modalAddBtn = document.getElementById("modal-add-btn");
let productoSeleccionado = null;

function abrirModal(id, productos) {
    productoSeleccionado = productos.find(p => p.id === id);
    if (!productoSeleccionado) return;
    modalImg.src = productoSeleccionado.imagen;
    modalTitle.textContent = productoSeleccionado.nombre;
    modalPrice.textContent = `$${productoSeleccionado.precio.toLocaleString()}`;
    modalDesc.textContent = productoSeleccionado.descripcion;
    modal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => modal.classList.add("hidden"));
modalAddBtn.addEventListener("click", () => {
    if (productoSeleccionado) {
        agregarAlCarrito(productoSeleccionado.id);
        modal.classList.add("hidden");
    }
});

// FORMULARIO DE AYUDA (ENVÍO ASÍNCRONO A FORMSPREE SIN SALIR DE LA PÁGINA)
const helpForm = document.getElementById("help-form");
if (helpForm) {
    helpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const formData = new FormData(helpForm);
        
        try {
            const response = await fetch(helpForm.action, {
                method: helpForm.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                Swal.fire({
                    title: '¡Mensaje enviado!',
                    text: 'Un agente se pondrá en contacto contigo a la brevedad.',
                    icon: 'success',
                    confirmButtonColor: '#39ff14'
                });
                helpForm.reset();
                helpSection.classList.add("hidden");
            } else {
                Swal.fire('Error', 'No se pudo enviar la consulta. Intenta nuevamente.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema de conexión.', 'error');
        }
    });
}

// PANEL ADMIN (AGREGAR / EDITAR)
adminTriggerBtn.addEventListener("click", () => {
    editProductId.value = "";
    document.getElementById("new-name").value = "";
    document.getElementById("new-price").value = "";
    document.getElementById("new-desc").value = "";
    adminModalTitle.textContent = "Panel de Administrador 🛠️";
    adminSubmitBtn.textContent = "Guardar Producto";
    adminPanel.classList.remove("hidden");
});
closeAdmin.addEventListener("click", () => adminPanel.classList.add("hidden"));

addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idEdit = editProductId.value;
    const nombre = document.getElementById("new-name").value;
    const precio = Number(document.getElementById("new-price").value);
    const descripcion = document.getElementById("new-desc").value;
    const fileInput = document.getElementById("new-img-file");

    const guardarDatos = async (imagenUrl) => {
        try {
            if (idEdit) {
                const dataUpdate = { nombre, precio, descripcion };
                if (imagenUrl) dataUpdate.imagen = imagenUrl;
                await updateDoc(doc(db, "productos", idEdit), dataUpdate);
                Swal.fire('¡Actualizado!', 'El producto fue modificado con éxito.', 'success');
            } else {
                await addDoc(collection(db, "productos"), {
                    nombre,
                    precio,
                    descripcion,
                    imagen: imagenUrl || "https://i.ibb.co/3s32J3K/172333.jpg"
                });
                Swal.fire('¡Éxito!', 'Producto agregado correctamente.', 'success');
            }
            adminPanel.classList.add("hidden");
            addProductForm.reset();
            cargarProductos();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar el producto', 'error');
        }
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.readAsDataURL(fileInput.files[0]);
        reader.onload = function (e) {
            guardarDatos(e.target.result);
        };
    } else {
        if (idEdit) {
            guardarDatos(null);
        } else {
            guardarDatos("https://i.ibb.co/3s32J3K/172333.jpg");
        }
    }
});

// SCROLL INTELIGENTE Y DETENCIÓN DE MENÚ EN FOOTER
const header = document.getElementById("main-header");
const floatingNav = document.getElementById("floating-nav");
const contactSection = document.getElementById("contacto");

window.addEventListener("scroll", () => {
    const scrollActual = window.pageYOffset;
    
    if (scrollActual > 150) {
        header.classList.add("hidden");
        floatingNav.classList.remove("hidden");
    } else {
        header.classList.remove("hidden");
        floatingNav.classList.add("hidden");
    }

    const contactRect = contactSection.getBoundingClientRect();
    if (contactRect.top <= window.innerHeight - 100) {
        floatingNav.classList.add("absolute");
    } else {
        floatingNav.classList.remove("absolute");
    }
});

// INICIO
cargarProductos();