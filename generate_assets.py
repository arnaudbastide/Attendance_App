from PIL import Image, ImageDraw, ImageFont
import os

def create_image(filename, size, color, text):
    img = Image.new('RGB', size, color=color)
    d = ImageDraw.Draw(img)
    try:
        pass
    except:
        pass
    img.save(filename)
    print(f"Created {filename}")

assets = [
    ("icon.png", (1024, 1024), "blue", "Icon"),
    ("adaptive-icon.png", (1024, 1024), "blue", "Adaptive"),
    ("splash.png", (1242, 2436), "white", "Splash"),
    ("favicon.png", (48, 48), "blue", "Fav"),
    ("logo.png", (500, 500), "blue", "Logo") # Added logo
]

# Ensure directory exists just in case
if not os.path.exists('mobile-app/assets'):
    os.makedirs('mobile-app/assets')

os.chdir('mobile-app/assets')

for name, size, color, text in assets:
    if not os.path.exists(name): # Only create if missing to preserve existing ones if any were manually replaced (though unlikely here)
        create_image(name, size, color, text)
    else:
        print(f"Skipping {name}, already exists")
