import os
import sys
import json
import shutil

def run_notebook(notebook_path):
    print(f"Reading notebook: {notebook_path}")
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    # Extract code cells
    code_cells = [
        "".join(cell['source'])
        for cell in nb['cells']
        if cell['cell_type'] == 'code'
    ]
    
    print(f"Found {len(code_cells)} code cells.")
    return code_cells

def main():
    # Keep track of paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    notebooks_dir = os.path.join(project_root, "notebooks")
    
    print(f"Project root: {project_root}")
    print(f"Notebooks directory: {notebooks_dir}")
    
    # Change working directory to notebooks/ so that relative paths in notebooks resolve correctly
    original_cwd = os.getcwd()
    os.chdir(notebooks_dir)
    print(f"Changed working directory to: {os.getcwd()}")
    
    # Mock matplotlib using sys.modules to avoid importing/installing it
    import sys
    from types import ModuleType
    
    dummy_plt = ModuleType('matplotlib.pyplot')
    dummy_plt.figure = lambda *args, **kwargs: None
    dummy_plt.plot = lambda *args, **kwargs: None
    dummy_plt.title = lambda *args, **kwargs: None
    dummy_plt.xlabel = lambda *args, **kwargs: None
    dummy_plt.ylabel = lambda *args, **kwargs: None
    dummy_plt.grid = lambda *args, **kwargs: None
    dummy_plt.show = lambda *args, **kwargs: None
    
    dummy_matplotlib = ModuleType('matplotlib')
    dummy_matplotlib.pyplot = dummy_plt
    dummy_matplotlib.use = lambda *args, **kwargs: None
    
    sys.modules['matplotlib'] = dummy_matplotlib
    sys.modules['matplotlib.pyplot'] = dummy_plt
    
    # Initialize global environment for execution
    global_env = {}
    
    # Run 02_Feature_Engineering.ipynb
    fe_path = "02_Feature_Engineering.ipynb"
    fe_cells = run_notebook(fe_path)
    
    print("Executing Feature Engineering notebook...")
    for idx, cell in enumerate(fe_cells):
        try:
            exec(cell, global_env)
        except Exception as e:
            print(f"Error executing Feature Engineering cell {idx + 1}: {e}")
            sys.exit(1)
            
    # Verify X_scaled is generated and save it to ../data/processed_features.csv
    if 'X_scaled' in global_env:
        print("Saving processed features to '../data/processed_features.csv'...")
        target_path = os.path.join("..", "data", "processed_features.csv")
        global_env['X_scaled'].to_csv(target_path, index=False)
        print("Processed features saved successfully.")
    else:
        print("Error: X_scaled not found in execution context of 02_Feature_Engineering.ipynb.")
        sys.exit(1)
        
    # Run 03_Model_Training.ipynb
    mt_path = "03_Model_Training.ipynb"
    mt_cells = run_notebook(mt_path)
    
    mt_global_env = {}
    
    print("Executing Model Training notebook...")
    for idx, cell in enumerate(mt_cells):
        try:
            exec(cell, mt_global_env)
        except Exception as e:
            print(f"Error executing Model Training cell {idx + 1}: {e}")
            sys.exit(1)
            
    # Check outputs
    scaler_path = os.path.join("..", "models", "scaler.pkl")
    kmeans_path = os.path.join("..", "models", "kmeans_model.pkl")
    
    if not os.path.exists(scaler_path) or not os.path.exists(kmeans_path):
        print("Error: Scaler or KMeans model was not generated.")
        sys.exit(1)
        
    print("Notebooks executed successfully. Model files generated in models/ directory.")
    
    # Copy files to backend/app/ml/artifacts/
    dest_dir = os.path.join("..", "backend", "app", "ml", "artifacts")
    os.makedirs(dest_dir, exist_ok=True)
    
    shutil.copy(scaler_path, os.path.join(dest_dir, "scaler.pkl"))
    shutil.copy(kmeans_path, os.path.join(dest_dir, "kmeans.pkl"))
    
    print(f"Copied scaler.pkl and kmeans.pkl to {os.path.abspath(dest_dir)}.")
    
    # Revert working directory
    os.chdir(original_cwd)
    print("Restored original working directory.")
    
    # Print metrics
    if 'best_k' in mt_global_env:
        print(f"Best K identified: {mt_global_env['best_k']}")

if __name__ == "__main__":
    main()
