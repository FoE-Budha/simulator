
# FOE Settlement Simulator

This is a client-side React application to simulate a Forge of Empires Quantum Settlement.

Features:
- Expandable grid (cells are 1 unit; you can treat groups as 4x4 blocks).
- Building palette with custom building creation.
- Click to place buildings; click building to remove.
- Snapshot capture & comparison.
- Export/import layout to JSON.
- Overlap prevention and simple grid snapping.

How to use:
1. Install dependencies: `npm install`
2. Run locally: `npm start`
3. Build for production: `npm run build` (upload `build/` to Cloudflare Pages or use GitHub integration)

Deploy to Cloudflare Pages:
- Create a new Pages project and either upload the build output or link to a GitHub repo containing this project.
