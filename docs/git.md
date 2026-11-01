# Simple Git Workflow

## One-time setup

```bash
git remote add origin git@github.com:USERNAME/REPO_NAME.git
git add .
git commit -m "initial commit"
git push -u origin master
```

## After adding or editing a feature

```bash
git status
git add .
git commit -m "add new feature"
git commit -m "feat: Add Group Model"
git commit -m "refactor: UI"
git push
```
