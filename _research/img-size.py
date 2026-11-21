from PIL import Image
for p in ['报告/figs/fig-lab-hero.png','_research/new-shots/home-cup.png','_research/new-shots/workshop.png','报告/figs-awake/cup-clean-1.png']:
    print(p, Image.open(p).size)