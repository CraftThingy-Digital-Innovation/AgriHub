@echo off
echo Installing git-subrepo locally...
if not exist ".git-subrepo" (
    git clone https://github.com/ingydotnet/git-subrepo .git-subrepo
) else (
    echo .git-subrepo already exists, skipping clone.
)

echo Fixing unsupported Windows symlinks...
copy /Y ".git-subrepo\ext\bashplus\lib\bash+.bash" ".git-subrepo\lib\git-subrepo.d\bash+.bash"

echo Configuring User PATH Environment Variable...
powershell -Command "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User'); $subrepoPath = '%~dp0.git-subrepo\lib'; if ($userPath -notmatch [regex]::Escape($subrepoPath)) { [Environment]::SetEnvironmentVariable('Path', $userPath + ';' + $subrepoPath, 'User'); Write-Host 'Successfully added to User PATH' } else { Write-Host 'Path already exists in User PATH' }"

echo.
echo =========================================================
echo Done! 
echo IMPORTANT: Please restart your terminal (close and open again) 
echo so that you can start using 'git subrepo'.
echo =========================================================
pause
