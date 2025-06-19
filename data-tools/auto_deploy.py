#!/usr/bin/env python3
"""
Automated Website Deployment
Rebuilds and optionally deploys the website
"""

import subprocess
import sys
import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def build_website():
    """Build the website"""
    
    logger.info("Building website...")
    
    website_dir = Path("website-source")
    if not website_dir.exists():
        logger.error("Website directory not found")
        return False
    
    try:
        # Change to website directory and build
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=website_dir,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            logger.info("✅ Website built successfully")
            
            # Check if dist directory was created
            dist_dir = website_dir / "dist"
            if dist_dir.exists():
                logger.info(f"✅ Build output ready at: {dist_dir}")
                return True
            else:
                logger.error("❌ Build completed but dist directory not found")
                return False
        else:
            logger.error(f"❌ Build failed with exit code {result.returncode}")
            logger.error(f"STDOUT: {result.stdout}")
            logger.error(f"STDERR: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Build timed out after 5 minutes")
        return False
    except Exception as e:
        logger.error(f"❌ Build failed with exception: {e}")
        return False

def deploy_to_platform():
    """Deploy to hosting platform (placeholder for actual deployment)"""
    
    logger.info("Deployment functionality ready")
    
    dist_dir = Path("website-source/dist")
    if not dist_dir.exists():
        logger.error("❌ No build output found. Run build first.")
        return False
    
    # Count files in dist
    files = list(dist_dir.rglob("*"))
    file_count = len([f for f in files if f.is_file()])
    
    logger.info(f"📁 Build contains {file_count} files ready for deployment")
    
    # This is where you would add your specific deployment logic
    # Examples:
    
    print("""
🚀 DEPLOYMENT OPTIONS:

1. Manual Upload:
   - Upload contents of website-source/dist/ to your web host
   
2. Cloudflare Pages:
   - Connect your repository to Cloudflare Pages
   - Set build command: npm run build
   - Set build output directory: dist
   
3. Netlify:
   - Drag and drop website-source/dist/ folder to Netlify
   - Or connect repository with build settings
   
4. Vercel:
   - Import project from repository
   - Vercel will auto-detect Vite settings
   
5. GitHub Pages:
   - Push dist/ contents to gh-pages branch
   
📁 Your files are ready at: website-source/dist/
    """)
    
    return True

def main():
    """Main deployment function"""
    
    print("🚀 Automated Website Deployment")
    print("=" * 40)
    
    # Build website
    if not build_website():
        logger.error("❌ Deployment failed - build unsuccessful")
        sys.exit(1)
    
    # Deploy (or show deployment options)
    if not deploy_to_platform():
        logger.error("❌ Deployment preparation failed")
        sys.exit(1)
    
    logger.info("🎉 Deployment process completed!")
    
    # Generate deployment report
    dist_dir = Path("website-source/dist")
    if dist_dir.exists():
        files = list(dist_dir.rglob("*"))
        file_count = len([f for f in files if f.is_file()])
        total_size = sum(f.stat().st_size for f in files if f.is_file())
        
        report = {
            "build_timestamp": "2025-06-19T03:46:18",
            "files_generated": file_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "status": "ready_for_deployment"
        }
        
        with open("deployment_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 DEPLOYMENT REPORT:")
        print(f"   Files generated: {file_count}")
        print(f"   Total size: {report['total_size_mb']} MB")
        print(f"   Status: Ready for deployment")
        
        print(f"\n📁 Deploy these files:")
        print(f"   Source: website-source/dist/")
        print(f"   Target: Your web hosting platform")

if __name__ == "__main__":
    main()
