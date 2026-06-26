import json
import os

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    file_path = os.path.join(project_root, "notebooks", "03_Model_Training.ipynb")
    
    print(f"Reading notebook: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    patched = False
    for cell in nb["cells"]:
        if cell["cell_type"] == "code":
            source_str = "".join(cell["source"])
            if "../data/pune_supplier_dataset.csv" in source_str and "processed_features.csv" in source_str:
                cell["source"] = [
                    "import pandas as pd\n",
                    "import numpy as np\n",
                    "import matplotlib.pyplot as plt\n",
                    "from sklearn.cluster import KMeans\n",
                    "from sklearn.metrics import silhouette_score\n",
                    "import joblib\n",
                    "\n",
                    "df = pd.read_csv('../data/pune_supplier_dataset.csv')\n",
                    "# Fix: calculate distance and filter delivery radius to match Notebook 02\n",
                    "from math import radians, sin, cos, sqrt, atan2\n",
                    "def haversine_distance(lat1, lon1, lat2, lon2):\n",
                    "    R = 6371\n",
                    "    dlat = radians(lat2-lat1)\n",
                    "    dlon = radians(lon2-lon1)\n",
                    "    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2\n",
                    "    c = 2*atan2(sqrt(a), sqrt(1-a))\n",
                    "    return R*c\n",
                    "\n",
                    "df['distance_km'] = df.apply(lambda x: haversine_distance(18.5204, 73.8567, x['latitude'], x['longitude']), axis=1)\n",
                    "df = df[df['distance_km'] <= df['delivery_radius_km']].copy()\n",
                    "\n",
                    "X = pd.read_csv('../data/processed_features.csv')\n",
                    "X.head()\n"
                ]
                patched = True
                print("Found cell and patched it.")
                break

    if patched:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(nb, f, indent=1)
        print("Notebook saved successfully.")
    else:
        print("Could not find cell to patch.")

if __name__ == "__main__":
    main()
