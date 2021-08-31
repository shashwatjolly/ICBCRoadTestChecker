# Windows
Invoke-Expression -Command "nexe -i ./prod.js -t win32 -o ./Release/Windows/ICBCRoadTestChecker.exe --build"
$compress = @{
  Path = "./Release/Windows/chrome-win", "./Release/Windows/ICBCRoadTestChecker.exe"
  CompressionLevel = "Fastest"
  DestinationPath = "./Release/Windows/ICBCRoadTestChecker-chrome-win.zip"
}
Compress-Archive -Force @compress

# Linux
Invoke-Expression -Command "nexe -i ./prod.js -t linux -o ./Release/Linux/ICBCRoadTestChecker --build"
$compress = @{
  Path = "./Release/Linux/chrome-linux", "./Release/Linux/ICBCRoadTestChecker"
  CompressionLevel = "Fastest"
  DestinationPath = "./Release/Linux/ICBCRoadTestChecker-chrome-linux.zip"
}
Compress-Archive -Force @compress

# Mac
Invoke-Expression -Command "nexe -i ./prod.js -t darwin -o ./Release/Mac/ICBCRoadTestChecker --build"
$compress = @{
  Path = "./Release/Mac/chrome-mac", "./Release/Mac/ICBCRoadTestChecker"
  CompressionLevel = "Fastest"
  DestinationPath = "./Release/Mac/ICBCRoadTestChecker-chrome-mac.zip"
}
Compress-Archive -Force @compress