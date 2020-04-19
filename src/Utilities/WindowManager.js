const {
  exec
} = require('child_process');

const getWindowScriptWindows = timer => `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Tricks {
[DllImport("user32.dll")]
public static extern IntPtr GetForegroundWindow();
}
"@

Function Get-Window {
    <#
        .SYNOPSIS
            Retrieve the window size (height,width) and coordinates (x,y) of
            a process window.

        .DESCRIPTION
            Retrieve the window size (height,width) and coordinates (x,y) of
            a process window.

        .PARAMETER ProcessName
            Name of the process to determine the window characteristics

        .NOTES
            Name: Get-Window
            Author: Boe Prox
            Version History
                1.0//Boe Prox - 11/20/2015
                    - Initial build

        .OUTPUT
            System.Automation.WindowInfo

        .EXAMPLE
            Get-Process powershell | Get-Window

            ProcessName Size     TopLeft  BottomRight
            ----------- ----     -------  -----------
            powershell  1262,642 2040,142 3302,784

            Description
            -----------
            Displays the size and coordinates on the window for the process PowerShell.exe

    #>
    [OutputType('System.Automation.WindowInfo')]
    [cmdletbinding()]
    Param (
        [parameter(ValueFromPipelineByPropertyName=$True)]
        $ProcessName
    )
    Begin {
        Try{
            [void][Window]
        } Catch {
        Add-Type @"
              using System;
              using System.Runtime.InteropServices;
              public class Window {
                [DllImport("user32.dll")]
                [return: MarshalAs(UnmanagedType.Bool)]
                public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
              }
              public struct RECT
              {
                public int Left;        // x position of upper-left corner
                public int Top;         // y position of upper-left corner
                public int Right;       // x position of lower-right corner
                public int Bottom;      // y position of lower-right corner
              }
"@
        }
    }
    Process {
        Get-Process -Name $ProcessName | ForEach {
            $Handle = $_.MainWindowHandle
            $Rectangle = New-Object RECT

			$a = [tricks]::GetForegroundWindow()

			$FrontmostProcess = (get-process | ? { $_.mainwindowhandle -eq $a }).ProcessName

			If ($FrontmostProcess -eq $ProcessName) {
				$Return = [Window]::GetWindowRect($Handle,[ref]$Rectangle)
			} Else {
				echo background
			}

            If ($Return) {
                $TopLeft = New-Object System.Management.Automation.Host.Coordinates -ArgumentList $Rectangle.Left, $Rectangle.Top
                $BottomRight = New-Object System.Management.Automation.Host.Coordinates -ArgumentList $Rectangle.Right, $Rectangle.Bottom
                If ($Rectangle.Top -lt 0 -AND $Rectangle.LEft -lt 0) {
                    Write-Warning "Window is minimized! Coordinates will not be accurate."
                }
                $Object = [pscustomobject]@{
                    ProcessName = $ProcessName
                    TopLeft = $TopLeft
                    BottomRight = $BottomRight
                }
                $Object.PSTypeNames.insert(0,'System.Automation.WindowInfo')
                $Object
            }
        }
    }
}
While (1) {
	Get-Process LeagueClientUx | Get-Window
	Start-Sleep -Milliseconds ${timer}
}
`;

class WindowManager {
  constructor(callback, timer = 100) {
    this.state = {
      child: null,
      currentPosition: {
        widthHeight: [null, null],
        topLeft: [null, null],
        bottomRight: [null, null]
      },
      timer: timer,
      callback: callback
    };
  }

  start() {
    if (this.state.child == null) {
      this.state.child = exec(getWindowScriptWindows(this.state.timer), {
        'shell': 'powershell.exe'
      });
      this.startWatching();
    }
  }

  stop() {
    if (this.state.child) {
      this.state.child.kill();
      this.state.child = null;
    }
  }

  setCallback(callback) {
    this.state.callback = callback;
  }

  tryToUpdateBounds(newPosition) {
    var changed = false;

    if (newPosition == null && this.state.currentPosition.bottomRight[0] != null) {
      this.state.currentPosition = {
        widthHeight: [null, null],
        topLeft: [null, null],
        bottomRight: [null, null]
      };
      changed = true;
    }

    if (newPosition != null && (this.state.currentPosition.bottomRight[0] != newPosition.bottomRight[0] || this.state.currentPosition.bottomRight[1] != newPosition.bottomRight[1])) {
      this.state.currentPosition = newPosition;
      changed = true;
    }

    if (changed) {
      if (this.state.currentPosition.bottomRight[0] === null) {
        this.state.callback(null);
      } else {
        this.state.callback(this.state.currentPosition);
      }
    }
  }

  startWatching() {
    this.state.child.stdout.on('data', output => {
      if (output.includes('background')) {
        this.tryToUpdateBounds(null);
      } else if (output.includes('LeagueClientUx')) {
        var data = output.replace('\\r\\n', '').split(/ +/);
        var topLeft = data[1].split(',').map(val => Number(val));
        var bottomRight = data[2].split(',').map(val => Number(val));
        var newPosition = {
          widthHeight: [bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]],
          topLeft: topLeft,
          bottomRight: bottomRight
        };

        if (topLeft[0] < -1000 && topLeft[1] < -1000 && bottomRight[0] < -1000 && bottomRight[1] < -1000 || isNaN(newPosition.widthHeight[0]) || isNaN(newPosition.widthHeight[1]) || isNaN(topLeft[0]) || isNaN(topLeft[1]) || isNaN(bottomRight[0]) || isNaN(bottomRight[1])) {
          this.tryToUpdateBounds(null);
        } else {
          this.tryToUpdateBounds(newPosition);
        }
      }
    });
    this.state.child.stderr.on('data', output => {
      this.tryToUpdateBounds(null);
    });
  }

}

module.exports = {
  WindowManager
};