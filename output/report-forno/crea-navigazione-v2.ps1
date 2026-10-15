Add-Type -AssemblyName System.Drawing
$outDir = $PSScriptRoot
$bmp = [Drawing.Bitmap]::new(2400,1800)
$g = [Drawing.Graphics]::FromImage($bmp)
$g.Clear([Drawing.Color]::White)
$g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$black = [Drawing.Brushes]::Black
$blue = [Drawing.ColorTranslator]::FromHtml('#195eb4')
$titleFont = [Drawing.Font]::new('Arial',38,[Drawing.FontStyle]::Bold,[Drawing.GraphicsUnit]::Pixel)
$headFont = [Drawing.Font]::new('Arial',29,[Drawing.FontStyle]::Bold,[Drawing.GraphicsUnit]::Pixel)
$bodyFont = [Drawing.Font]::new('Arial',24,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel)
$labelFont = [Drawing.Font]::new('Arial',22,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel)
$smallFont = [Drawing.Font]::new('Arial',23,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel)
$center = [Drawing.StringFormat]::new()
$center.Alignment = [Drawing.StringAlignment]::Center
$center.LineAlignment = [Drawing.StringAlignment]::Center
$palette = @('#e8f2ff','#e7f4e2','#ffe9e9','#fff5c9')
$nodes = @{}
function Page($key,$x,$y,$w,$h,$color,$name,$body) {
  $nodes[$key] = @{x=$x;y=$y;w=$w;h=$h;color=$color;name=$name;body=$body}
}
function Edge($coords,$label,$lx,$ly,$dashed=$false) {
  $color = if ($dashed) {$blue} else {[Drawing.Color]::FromArgb(40,40,40)}
  $pen = [Drawing.Pen]::new($color,3)
  if ($dashed) {$pen.DashStyle = [Drawing.Drawing2D.DashStyle]::Dash}
  $points = [Drawing.PointF[]]@(for($i=0;$i -lt $coords.Count;$i+=2){[Drawing.PointF]::new($coords[$i],$coords[$i+1])})
  $g.DrawLines($pen,$points)
  $a=$points[$points.Count-2]; $b=$points[$points.Count-1]
  $dx=$b.X-$a.X; $dy=$b.Y-$a.Y; $len=[Math]::Sqrt($dx*$dx+$dy*$dy)
  $ux=$dx/$len; $uy=$dy/$len
  $triangle=[Drawing.PointF[]]@($b,[Drawing.PointF]::new($b.X-17*$ux+7*$uy,$b.Y-17*$uy-7*$ux),[Drawing.PointF]::new($b.X-17*$ux-7*$uy,$b.Y-17*$uy+7*$ux))
  $brush=[Drawing.SolidBrush]::new($color)
  $g.FillPolygon($brush,$triangle)
  if($label){
    $size=$g.MeasureString($label,$labelFont)
    $g.FillRectangle([Drawing.Brushes]::White,[single]$lx,[single]$ly,$size.Width+8,$size.Height+4)
    $g.DrawString($label,$labelFont,$brush,[single]($lx+4),[single]($ly+2))
  }
  $brush.Dispose(); $pen.Dispose()
}
Page 'home' 60 290 210 140 0 'Home' '/'
Page 'chi' 310 290 220 140 0 'Chi siamo' '/chi-siamo'
Page 'contatti' 570 290 220 140 0 'Contatti' '/contatti'
Page 'catalogo' 60 520 260 140 0 'Catalogo' '/catalogo'
Page 'prodotto' 60 780 330 190 0 "Dettaglio`nprodotto" "/catalogo/[id]`nInformazioni e recensioni"
Page 'recensionip' 60 1090 330 190 3 "Recensioni`nprodotto" "/catalogo/[id]#recensioni`nSezione nella pagina"
Page 'reg' 410 1020 310 150 0 'Registrati' '/registrati'
Page 'login' 410 1250 310 150 0 'Login' '/login'
Page 'area' 1080 290 320 150 1 'Area privata' "/area-privata`nProfilo cliente"
Page 'carrello' 880 610 290 180 1 'Carrello' "/carrello`nQuantità e riepilogo"
Page 'ordini' 1260 610 290 180 1 'I miei ordini' '/ordini'
Page 'recensioni' 880 910 290 150 1 "Le mie`nrecensioni" '/recensioni'
Page 'ticket' 1260 910 290 150 1 'I miei ticket' "/ticket`nElenco e apertura"
Page 'ordine' 880 1210 290 180 1 "Dettaglio`nordine" "/ordini/[id]`nArticoli, importi, stato"
Page 'tickdet' 1260 1210 290 180 1 "Dettaglio`nticket" "/ticket/[id]`nRichiesta e risposte"
Page 'admin' 1880 290 320 150 2 "Area`namministrazione" "/admin — Gestore"
Page 'prodadmin' 1630 660 220 160 2 "Gestione`nprodotti" '/admin/prodotti'
Page 'ordadmin' 1890 660 220 160 2 "Gestione`nordini" '/admin/ordini'
Page 'tickadmin' 2150 660 220 160 2 "Gestione`nticket" '/admin/ticket'
Page 'formprod' 1630 1120 220 250 2 "Aggiungi /`nModifica`nprodotto" "Modulo dati, prezzo`ne disponibilità"
Page 'ordadmindet' 1890 1120 220 250 2 "Dettaglio`nordine`ngestore" "/admin/ordini/[id]`nAggiornamento stato"
Page 'tickadmindet' 2150 1120 220 250 2 "Dettaglio`nticket`ngestore" "/admin/ticket/[id]`nRisposta e stato"
$g.DrawString('5.1 Modello di navigazione progettuale — Forno DiGesù',$titleFont,[Drawing.Brushes]::MidnightBlue,[Drawing.RectangleF]::new(30,20,2340,80),$center)
$bannerBrush=[Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#f0f5fb'))
$g.FillRectangle($bannerBrush,30,110,2340,105)
$banner="Barra comune su tutte le pagine: Home • Chi siamo • Catalogo • Contatti • Login / Registrati [visitatore]`nArea privata / Carrello [cliente] • Area amministrazione [gestore] • Esci [autenticato]"
$g.DrawString($banner,$smallFont,$black,[Drawing.RectangleF]::new(45,120,2310,85),$center)
foreach($panel in @(@(30,790,0,'PUBBLICO'),@(850,710,1,'CLIENTE'),@(1610,770,2,'GESTORE'))){
  $brush=[Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($palette[$panel[2]]))
  $g.FillRectangle($brush,[int]$panel[0],230,[int]$panel[1],50)
  $g.DrawString($panel[3],$headFont,$black,[Drawing.RectangleF]::new($panel[0],230,$panel[1],50),$center)
  $brush.Dispose()
}
Edge @(165,430,165,520) 'Apri catalogo' 180 455
Edge @(190,660,190,780) 'Seleziona prodotto' 205 690
Edge @(200,970,200,1090) 'Vai alle recensioni' 80 1020
Edge @(565,1170,565,1250) "Registrazione`nriuscita" 580 1175 $true
Edge @(720,1325,805,1325,805,365,1080,365) "Login riuscito`n[cliente]" 810 470 $true
Edge @(565,1400,565,1430,1585,1430,1585,365,1880,365) "Login riuscito [gestore]" 1040 1395 $true
Edge @(390,865,835,865,835,755,880,755) "Aggiungi / apri`n[cliente]" 460 820
Edge @(1150,440,1150,540,1025,540,1025,610) 'Apri carrello' 905 545
Edge @(1330,440,1330,540,1405,540,1405,610) 'Consulta ordini' 1300 490
Edge @(1080,405,860,405,860,985,880,985) "Consulta`nrecensioni" 875 825
Edge @(1400,405,1570,405,1570,985,1550,985) "Apri`nassistenza" 1460 835
Edge @(1405,790,1405,860,1220,860,1220,1295,1170,1295) "Seleziona`nordine" 1195 1105
Edge @(1025,790,1025,865,1195,865,1195,1175,1025,1175,1025,1210) "Acquisto`nconfermato" 1040 1110 $true
Edge @(1405,1060,1405,1210) "Seleziona`nticket" 1420 1095
Edge @(1950,440,1950,560,1740,560,1740,660) 'Apri prodotti' 1660 580
Edge @(2040,440,2040,570,2000,570,2000,660) "Consulta`nordini" 1945 580
Edge @(2130,440,2130,560,2260,560,2260,660) "Apri`nassistenza" 2170 580
Edge @(1740,820,1740,1120) "Nuovo /`nmodifica" 1750 925
Edge @(1630,1245,1620,1245,1620,845,1690,845,1690,820) "Salvataggio`nriuscito" 1630 1030 $true
Edge @(2000,820,2000,1120) "Seleziona`nordine" 2010 925
Edge @(2260,820,2260,1120) "Seleziona`nticket" 2270 925
foreach($n in $nodes.Values){
  $x=$n.x; $y=$n.y; $w=$n.w; $h=$n.h; $fold=25
  $points=[Drawing.PointF[]]@([Drawing.PointF]::new($x,$y),[Drawing.PointF]::new($x+$w-$fold,$y),[Drawing.PointF]::new($x+$w,$y+$fold),[Drawing.PointF]::new($x+$w,$y+$h),[Drawing.PointF]::new($x,$y+$h))
  $brush=[Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($palette[$n.color]))
  $pen=[Drawing.Pen]::new([Drawing.Color]::FromArgb(45,75,100),2)
  $g.FillPolygon($brush,$points); $g.DrawPolygon($pen,$points)
  $g.DrawLines($pen,[Drawing.PointF[]]@([Drawing.PointF]::new($x+$w-$fold,$y),[Drawing.PointF]::new($x+$w-$fold,$y+$fold),[Drawing.PointF]::new($x+$w,$y+$fold)))
  $nameHeight=if($n.name.Split("`n").Count -eq 3){110}elseif($n.name.Contains("`n")){80}else{50}
  $nodeFont=if($w -le 220){[Drawing.Font]::new('Arial',24,[Drawing.FontStyle]::Bold,[Drawing.GraphicsUnit]::Pixel)}else{$headFont}
  $nodeBodyFont=if($w -le 220){[Drawing.Font]::new('Arial',19,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel)}else{$bodyFont}
  $g.DrawString($n.name,$nodeFont,$black,[Drawing.RectangleF]::new($x+7,$y+15,$w-14,$nameHeight),$center)
  $g.DrawString($n.body,$nodeBodyFont,$black,[Drawing.RectangleF]::new($x+7,$y+15+$nameHeight,$w-14,$h-$nameHeight-22),$center)
  $brush.Dispose(); $pen.Dispose()
}
$g.FillRectangle($bannerBrush,30,1475,2340,295)
$legend=@(
 'Legenda: blu = pagina pubblica; verde = pagina cliente; rosso = pagina gestore; giallo = sezione nella pagina.',
 'Freccia continua = navigazione o azione; freccia tratteggiata = reindirizzamento automatico; [ ] = condizione.',
 'Pagina riservata senza sessione valida → Login. Ruolo non autorizzato → accesso negato.',
 'Esci da qualsiasi pagina autenticata → Login e terminazione della sessione.',
 'Credenziali errate o registrazione non valida: permanenza nel modulo con segnalazione.',
 'Pubblicazione recensione: cliente con acquisto del prodotto verificato.',
 'Modello finale progettuale. Nella v0.1: Home, Registrati, Login e Area privata.',
 'Le altre pagine, i percorsi URL e la gestione dei ruoli sono proposte per le successive versioni.'
)
$ly=1490
foreach($line in $legend){$g.DrawString($line,$smallFont,$black,50,$ly);$ly+=33}
$bmp.Save((Join-Path $outDir 'diagramma-navigazione-progettuale-v2.png'),[Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $bannerBrush.Dispose()
