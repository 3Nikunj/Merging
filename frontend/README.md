# React + Vite Placement Application

This project is containerized using Docker to ensure all team members develop in a unified environment.

## 🚀 How to Run the Project (For Team Members)

**Prerequisites:**
You only need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine. You **do not** need to install Node.js locally.

### Step 1: Clone the Repository
Clone this repository to your local machine:
```bash
git clone <your-github-repo-url>
cd <repository-directory>
```

### Step 2: Start the Application
Run the following command in the root of the project to build the image and start the application:
```bash
docker-compose up --build
```
*Note: You can omit `--build` on subsequent runs unless dependencies (`package.json`) have changed.*

### Step 3: Access the Application
Once the container is running, open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

### Step 4: Develop
Open the project in your favorite code editor (like VS Code). Any changes you make to the source code will automatically trigger a Hot Module Replacement (HMR) and instantly reflect in your browser. All Node modules and configuration run safely inside the Docker container!

---

## Adding New Packages
If you need to install a new npm package, run the command inside the container:
```bash
docker-compose exec app npm install <package-name>
```

---

## Default Vite Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

---

## Backend API

This project now includes a Python + FastAPI backend in `backend/`.

Backend URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

Backend setup details are in:

```text
backend/README.md
```
