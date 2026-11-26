import { useId } from 'react';

const colours = {
  navy: '#1c293e', muted: '#6d788a', line: '#e1e6ed', pale: '#f3f6fa',
  blue: '#426bc0', bluePale: '#eaf0fc', gold: '#b4934d', goldPale: '#f7f1e4',
  green: '#477d68', greenPale: '#e9f4ee', white: '#ffffff',
};

const descriptions = {
  workspace: 'Illustrative admin overview with separate private stock and website showcase cards, a category donut and comparison bars. Figures are placeholders.',
  gemstone: 'Illustrative sapphire record with an automatically assigned Gem ID, gemstone details and a save action.',
  media: 'Illustrative gemstone media editor showing a cover photograph, extra photographs, video and a certificate.',
  calendar: 'Illustrative calendar with category-coloured appointments and a dated note alongside the selected day.',
  publication: 'Illustrative workshop publication workflow from a private draft to scheduled publication and a published post.',
  settings: 'Illustrative Home and Contact settings with editable content and protected, read-only verified contacts.',
  moderation: 'Illustrative customer review moving from Pending to Approved. Only approved reviews appear publicly.',
  archive: 'Illustrative sold-gem workflow: enter exact Gem IDs, review matching records, archive and use Undo when available.',
  access: 'Illustrative protected administrator access with email and Google sign-in, verification and a connection retry action.',
};

function Label({ x, y, children, size = 11, fill = colours.navy, weight = 500, ...props }) {
  return <text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} {...props}>{children}</text>;
}

function Panel({ x, y, width, height, fill = colours.white, stroke = colours.line, ...props }) {
  return <rect x={x} y={y} width={width} height={height} rx="10" fill={fill} stroke={stroke} {...props} />;
}

function Lines({ x, y, width = 90, rows = 3, colour = colours.line }) {
  return <g fill={colour}>{Array.from({ length: rows }, (_, index) => (
    <rect key={index} x={x} y={y + index * 11} width={index === rows - 1 ? width * 0.68 : width} height="4" rx="2" />
  ))}</g>;
}

function Check({ x, y, colour = colours.green, size = 16 }) {
  return <path d={`M${x + size * 0.15} ${y + size * 0.52}l${size * 0.23} ${size * 0.23} ${size * 0.49}-${size * 0.5}`} fill="none" stroke={colour} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />;
}

function Lock({ x, y, colour = colours.gold }) {
  return <g transform={`translate(${x} ${y})`} fill="none" stroke={colour} strokeWidth="1.7" strokeLinecap="round">
    <path d="M4 8V5a4 4 0 0 1 8 0v3" />
    <rect x="1" y="8" width="14" height="12" rx="3" />
    <path d="M8 12v4" />
  </g>;
}

function Gem({ x = 0, y = 0, scale = 1, ids }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#9aaff1" strokeWidth="0.65" strokeLinejoin="round">
    <path d="M26 0h68l26 37-60 70L0 37Z" fill={`url(#${ids.sapphire})`} />
    <path d="M26 0 43 37 0 37Z" fill="#3154a0" />
    <path d="M26 0h68L76 37H43Z" fill={`url(#${ids.facet})`} />
    <path d="m94 0 26 37H76Z" fill="#294a94" />
    <path d="m43 37 17 70L0 37Z" fill="#1d3674" />
    <path d="M43 37h33l-16 70Z" fill="#3962bd" />
    <path d="m76 37 44 0-60 70Z" fill="#172b60" />
    <path d="m26 0 34 13L94 0M43 37l17-24 16 24" fill="none" stroke="#b5c8f5" />
    <path d="m18 31 10-17M23 19l8-3" fill="none" stroke="#e1eafa" strokeWidth="1.8" strokeLinecap="round" />
  </g>;
}

function Workspace() {
  return <g>
    <Panel x="24" y="77" width="70" height="164" fill={colours.navy} stroke={colours.navy} />
    <rect x="36" y="92" width="46" height="22" rx="5" fill="#354761" />
    <Label x="59" y="106" size="9" fill={colours.white} textAnchor="middle">Overview</Label>
    <Lines x="37" y="129" width="43" rows={5} colour="#53627a" />
    <circle cx="44" cy="221" r="4" fill={colours.gold} />
    <Label x="54" y="224" size="8" fill="#ced6e3">Workspace</Label>
    <Panel x="107" y="77" width="147" height="49" />
    <Panel x="265" y="77" width="151" height="49" />
    <Label x="119" y="95" size="10" fill={colours.muted}>PRIVATE STOCK</Label>
    <Label x="119" y="115" size="18" weight="700">—</Label>
    <Label x="277" y="95" size="10" fill={colours.muted}>WEBSITE SHOWCASE</Label>
    <Label x="277" y="115" size="18" weight="700">—</Label>
    <Panel x="107" y="137" width="147" height="104" />
    <circle cx="154" cy="184" r="27" fill="none" stroke={colours.bluePale} strokeWidth="12" />
    <circle cx="154" cy="184" r="27" fill="none" stroke={colours.blue} strokeWidth="12" strokeDasharray="98 170" transform="rotate(-90 154 184)" />
    <circle cx="154" cy="184" r="27" fill="none" stroke={colours.gold} strokeWidth="12" strokeDasharray="33 170" strokeDashoffset="-104" transform="rotate(-90 154 184)" />
    <Label x="154" y="188" size="13" textAnchor="middle">—</Label>
    <circle cx="198" cy="175" r="3" fill={colours.blue} />
    <Label x="205" y="178" size="8">Blue</Label>
    <circle cx="198" cy="193" r="3" fill={colours.gold} />
    <Label x="205" y="196" size="8">Yellow</Label>
    <Label x="120" y="228" size="9" fill={colours.muted}>Category distribution</Label>
    <Panel x="265" y="137" width="151" height="104" />
    <Label x="278" y="155" size="10" weight="600">Compare categories</Label>
    {[
      ['Sapphire', 170, 87, colours.blue],
      ['Ruby', 194, 58, '#a7687e'],
      ['Other', 218, 72, colours.gold],
    ].map(([label, y, width, fill]) => <g key={label}>
      <Label x="278" y={y} size="8" fill={colours.muted}>{label}</Label>
      <rect x="278" y={y + 5} width="112" height="5" rx="2.5" fill={colours.pale} />
      <rect x="278" y={y + 5} width={width} height="5" rx="2.5" fill={fill} />
    </g>)}
  </g>;
}

function Gemstone({ ids }) {
  return <g>
    <Panel x="24" y="77" width="184" height="164" fill="#edf1f9" />
    <ellipse cx="116" cy="218" rx="55" ry="7" fill="#dbe2f0" />
    <Gem x="50" y="104" scale={1.1} ids={ids} />
    <rect x="38" y="88" width="73" height="20" rx="10" fill={colours.white} />
    <Label x="74" y="101" size="9" fill={colours.blue} textAnchor="middle" weight="600">GEMSTONE</Label>
    <Panel x="220" y="77" width="196" height="164" />
    <Label x="234" y="99" size="12" weight="700">Gemstone details</Label>
    <rect x="234" y="111" width="168" height="38" rx="7" fill={colours.goldPale} />
    <Label x="246" y="126" size="10" fill="#856a33" weight="600">Generated Gem ID</Label>
    <Label x="246" y="140" size="9" fill={colours.muted}>Assigned automatically on save</Label>
    {['Carat weight', 'Shape', 'Colour'].map((label, index) => <g key={label}>
      <Label x="234" y={169 + index * 17} size="10" fill={colours.muted}>{label}</Label>
      <Label x="395" y={169 + index * 17} size="11" textAnchor="end">—</Label>
    </g>)}
    <rect x="333" y="214" width="69" height="19" rx="5" fill={colours.navy} />
    <Label x="367" y="227" size="9" fill={colours.white} textAnchor="middle">Save gem</Label>
  </g>;
}

function Media({ ids }) {
  return <g>
    <Panel x="24" y="77" width="220" height="164" />
    <rect x="32" y="85" width="204" height="119" rx="7" fill="#eaf0fa" />
    <Gem x="88" y="99" scale={0.78} ids={ids} />
    <rect x="42" y="95" width="52" height="18" rx="9" fill={colours.white} />
    <Label x="68" y="107" size="8" fill={colours.blue} textAnchor="middle" weight="700">COVER</Label>
    <Label x="38" y="221" size="11" weight="600">Cover photograph</Label>
    <Label x="38" y="234" size="9" fill={colours.muted}>Choose the clearest first view</Label>
    <Panel x="256" y="77" width="160" height="47" />
    <rect x="264" y="85" width="34" height="31" rx="5" fill={colours.bluePale} />
    <Gem x="272" y="92" scale={0.16} ids={ids} />
    <Label x="308" y="98" size="11" weight="600">More photos</Label>
    <Label x="308" y="112" size="9" fill={colours.muted}>Detail and angles</Label>
    <Panel x="256" y="133" width="160" height="47" />
    <rect x="264" y="141" width="34" height="31" rx="5" fill={colours.goldPale} />
    <path d="m278 149 10 7-10 7Z" fill={colours.gold} />
    <Label x="308" y="154" size="11" weight="600">Video</Label>
    <Label x="308" y="168" size="9" fill={colours.muted}>Optional movement</Label>
    <Panel x="256" y="189" width="160" height="52" />
    <rect x="271" y="198" width="21" height="32" rx="3" fill={colours.pale} stroke={colours.line} />
    <Lines x="275" y="204" width="13" rows={2} colour="#b9c3d1" />
    <circle cx="282" cy="222" r="4" fill={colours.goldPale} stroke={colours.gold} />
    <Label x="308" y="211" size="11" weight="600">Certificate</Label>
    <Label x="308" y="225" size="9" fill={colours.muted}>Upload the image</Label>
  </g>;
}

function Calendar() {
  return <g>
    <Panel x="24" y="77" width="246" height="164" />
    <Label x="39" y="99" size="12" weight="700">Calendar</Label>
    <path d="m228 89-5 5 5 5m17-10 5 5-5 5" fill="none" stroke={colours.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <Label key={index} x={46 + index * 33} y="119" size="8" textAnchor="middle" fill={colours.muted}>{day}</Label>)}
    {Array.from({ length: 28 }, (_, index) => {
      const x = 32 + (index % 7) * 33;
      const y = 127 + Math.floor(index / 7) * 26;
      return <g key={index}>
        <rect x={x} y={y} width="29" height="23" rx="4" fill={index === 9 ? colours.bluePale : colours.pale} stroke={index === 9 ? colours.blue : 'none'} />
        <Label x={x + 5} y={y + 11} size="7" fill={index === 9 ? colours.blue : colours.muted}>{index + 1}</Label>
        {[2, 9, 17, 23].includes(index) && <rect x={x + 4} y={y + 16} width="21" height="3" rx="1.5" fill={index === 17 ? '#a66883' : colours.blue} />}
        {index === 9 && <circle cx={x + 23} cy={y + 7} r="2" fill={colours.gold} />}
      </g>;
    })}
    <Label x="39" y="235" size="8" fill={colours.muted}>Select a day to see its details</Label>
    <Panel x="282" y="77" width="134" height="164" />
    <Label x="294" y="99" size="11" weight="700">Selected day</Label>
    <rect x="294" y="111" width="110" height="48" rx="6" fill={colours.bluePale} />
    <rect x="294" y="111" width="3" height="48" rx="1.5" fill={colours.blue} />
    <Label x="304" y="129" size="10" weight="600">Appointment</Label>
    <Label x="304" y="144" size="9" fill={colours.muted}>Category colour</Label>
    <rect x="294" y="170" width="110" height="43" rx="6" fill={colours.goldPale} />
    <rect x="294" y="170" width="3" height="43" rx="1.5" fill={colours.gold} />
    <Label x="304" y="188" size="10" weight="600">Dated note</Label>
    <Label x="304" y="202" size="9" fill={colours.muted}>Saved for this day</Label>
    <Label x="294" y="231" size="8" fill={colours.muted}>Sri Lanka time</Label>
  </g>;
}

function Publication() {
  return <g>
    {[
      { x: 24, name: 'Draft', detail: 'Saved privately', fill: colours.pale, colour: colours.muted },
      { x: 161, name: 'Scheduled', detail: 'Publish at set time', fill: colours.goldPale, colour: colours.gold },
      { x: 298, name: 'Published', detail: 'Visible on website', fill: colours.greenPale, colour: colours.green },
    ].map(({ x, name, detail, fill, colour }, index) => <g key={name}>
      <Panel x={x} y="89" width="118" height="116" />
      <circle cx={x + 59} cy="123" r="19" fill={fill} />
      {index === 0 && <g transform={`translate(${x + 51} 115)`} fill="none" stroke={colour} strokeWidth="1.8" strokeLinejoin="round"><path d="m1 11 10-10 4 4L5 15l-5 1Z" /><path d="m9 3 4 4" /></g>}
      {index === 1 && <g fill="none" stroke={colour} strokeWidth="1.8" strokeLinecap="round"><circle cx={x + 59} cy="123" r="10" /><path d={`M${x + 59} 116v7l5 3`} /></g>}
      {index === 2 && <Check x={x + 49} y="113" size={21} colour={colour} />}
      <Label x={x + 59} y="162" size="12" weight="700" textAnchor="middle">{name}</Label>
      <Label x={x + 59} y="181" size="9" fill={colours.muted} textAnchor="middle">{detail}</Label>
    </g>)}
    <path d="m148 141 5 5-5 5m137-10 5 5-5 5" fill="none" stroke={colours.gold} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="24" y="217" width="392" height="26" rx="7" fill={colours.bluePale} />
    <Label x="220" y="234" size="10" fill={colours.blue} textAnchor="middle">Publication time and event time are separate.</Label>
  </g>;
}

function Settings() {
  return <g>
    <Panel x="24" y="77" width="392" height="164" />
    <rect x="37" y="88" width="75" height="25" rx="6" fill={colours.navy} />
    <Label x="74" y="104" size="10" fill={colours.white} textAnchor="middle">Home</Label>
    <Label x="156" y="104" size="10" fill={colours.muted} textAnchor="middle">Contact</Label>
    <path d="M37 122h366" stroke={colours.line} />
    <Label x="39" y="142" size="10" weight="600">Page content</Label>
    <rect x="39" y="151" width="219" height="23" rx="5" fill={colours.pale} stroke={colours.line} />
    <Label x="48" y="166" size="9" fill={colours.muted}>Headline and page photographs</Label>
    <Lines x="40" y="186" width="179" rows={2} />
    <rect x="191" y="211" width="67" height="19" rx="5" fill={colours.navy} />
    <Label x="224" y="224" size="9" fill={colours.white} textAnchor="middle">Save page</Label>
    <rect x="274" y="134" width="129" height="96" rx="8" fill={colours.goldPale} />
    <Lock x="286" y="145" />
    <Label x="311" y="155" size="10" weight="600">Verified</Label>
    <Label x="311" y="169" size="10" weight="600">contacts</Label>
    <Lines x="287" y="183" width="101" rows={2} colour="#ddd2b8" />
    <Label x="287" y="218" size="9" fill="#856a33">Read-only</Label>
  </g>;
}

function ReviewStars({ x, y, colour }) {
  return <g fill={colour}>{Array.from({ length: 5 }, (_, index) => <path key={index} transform={`translate(${x + index * 13} ${y})`} d="m5 0 1.5 3.2L10 3.7 7.5 6.2 8.1 9.7 5 8.1 1.9 9.7 2.5 6.2 0 3.7l3.5-.5Z" />)}</g>;
}

function Moderation() {
  return <g>
    {[
      { x: 24, title: 'Pending', colour: colours.gold, pale: colours.goldPale },
      { x: 234, title: 'Approved', colour: colours.green, pale: colours.greenPale },
    ].map(({ x, title, colour, pale }) => <g key={title}>
      <Panel x={x} y="84" width="182" height="121" />
      <circle cx={x + 25} cy="109" r="12" fill={colours.pale} />
      <circle cx={x + 25} cy="106" r="3.2" fill="#a8b4c6" />
      <path d={`M${x + 19} 116a6 6 0 0 1 12 0`} fill="#a8b4c6" />
      <Label x={x + 46} y="108" size="10" weight="600">Customer review</Label>
      <ReviewStars x={x + 46} y="115" colour={colours.gold} />
      <Lines x={x + 14} y="139" width="150" rows={3} />
      <rect x={x + 14} y="177" width="79" height="19" rx="9.5" fill={pale} />
      <Label x={x + 53} y="190" size="9" fill={colour} textAnchor="middle" weight="600">{title}</Label>
      {title === 'Approved' && <Check x={x + 151} y="179" size={15} />}
    </g>)}
    <path d="M212 144h15m-5-5 5 5-5 5" stroke={colours.gold} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="24" y="217" width="392" height="26" rx="7" fill={colours.greenPale} />
    <Label x="220" y="234" size="10" fill={colours.green} textAnchor="middle">Only approved reviews appear on the public website.</Label>
  </g>;
}

function Archive({ ids }) {
  return <g>
    <Panel x="24" y="77" width="237" height="164" />
    <Label x="39" y="99" size="12" weight="700">Archive sold gemstones</Label>
    <Label x="39" y="119" size="10" fill={colours.muted}>Paste exact Gem IDs</Label>
    <rect x="39" y="128" width="207" height="42" rx="6" fill={colours.pale} stroke={colours.line} />
    <Label x="50" y="146" size="10" fill={colours.muted}>Gem ID, Gem ID</Label>
    <path d="M50 157h69m7 0h45" stroke="#b8c3d1" strokeWidth="2" strokeLinecap="round" />
    <rect x="39" y="181" width="207" height="25" rx="6" fill={colours.navy} />
    <Label x="142" y="197" size="10" fill={colours.white} textAnchor="middle">Preview matching records</Label>
    <Label x="39" y="225" size="9" fill={colours.muted}>Check each match before confirming</Label>
    <Panel x="274" y="77" width="142" height="164" />
    <Label x="288" y="99" size="11" weight="700">Review preview</Label>
    <rect x="287" y="111" width="116" height="52" rx="6" fill={colours.bluePale} />
    <Gem x="299" y="124" scale={0.23} ids={ids} />
    <Label x="337" y="133" size="9" weight="600">Exact match</Label>
    <Label x="337" y="148" size="9" fill={colours.muted}>Gem ID: —</Label>
    <rect x="287" y="175" width="116" height="23" rx="6" fill={colours.goldPale} />
    <Label x="345" y="190" size="10" fill="#856a33" textAnchor="middle">Archive</Label>
    <path d="m299 217-5-5 5-5m-5 5h9a5 5 0 0 1 0 10" fill="none" stroke={colours.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <Label x="316" y="218" size="10" fill={colours.blue}>Undo archive</Label>
  </g>;
}

function Access() {
  return <g>
    <Panel x="24" y="77" width="157" height="164" fill={colours.bluePale} />
    <path d="m103 99 41 15v38c0 27-26 45-41 51-15-6-41-24-41-51v-38Z" fill={colours.white} stroke="#b7c7e8" strokeWidth="1.5" />
    <path d="m103 108 32 12v32c0 21-20 37-32 42-12-5-32-21-32-42v-32Z" fill="#eef3fc" />
    <circle cx="103" cy="144" r="21" fill={colours.navy} />
    <Check x="89" y="130" size={28} colour="#ddc68c" />
    <Label x="102" y="220" size="10" fill={colours.blue} textAnchor="middle" weight="600">Protected workspace</Label>
    <Panel x="194" y="77" width="222" height="164" />
    <Label x="208" y="99" size="12" weight="700">Administrator sign-in</Label>
    <rect x="208" y="111" width="194" height="25" rx="5" fill={colours.pale} stroke={colours.line} />
    <Label x="219" y="127" size="10" fill={colours.muted}>Email and password</Label>
    <rect x="208" y="145" width="194" height="25" rx="5" fill={colours.white} stroke={colours.line} />
    <circle cx="224" cy="157" r="6" fill={colours.bluePale} />
    <Label x="237" y="161" size="10">Google sign-in</Label>
    <Check x="207" y="178" size={14} />
    <Label x="228" y="189" size="9" fill={colours.green}>Approved administrator only</Label>
    <rect x="208" y="204" width="194" height="26" rx="6" fill={colours.goldPale} />
    <Label x="217" y="221" size="9" fill="#856a33">Connection issue?</Label>
    <Label x="388" y="221" size="10" fill={colours.navy} weight="700" textAnchor="end">Retry</Label>
  </g>;
}

const illustrations = {
  workspace: Workspace, gemstone: Gemstone, media: Media, calendar: Calendar,
  publication: Publication, settings: Settings, moderation: Moderation,
  archive: Archive, access: Access,
};

export default function GuideIllustration({ kind = 'workspace', className = '' }) {
  const uniqueId = useId().replace(/:/g, '');
  const ids = {
    canvas: `guide-${uniqueId}-canvas`, sapphire: `guide-${uniqueId}-sapphire`,
    facet: `guide-${uniqueId}-facet`, gold: `guide-${uniqueId}-gold`,
  };
  const selected = Object.hasOwn(illustrations, kind) ? kind : 'workspace';
  const Illustration = illustrations[selected];

  return <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 440 280"
    width="440"
    height="280"
    role="img"
    aria-label={descriptions[selected]}
    focusable="false"
    style={{ maxWidth: '100%', height: 'auto', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
  >
    <title>{descriptions[selected]}</title>
    <defs>
      <linearGradient id={ids.canvas} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f8fafd" /><stop offset="1" stopColor="#edf1f7" />
      </linearGradient>
      <linearGradient id={ids.sapphire} x1="0" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#6588d8" /><stop offset="0.55" stopColor="#294b9a" /><stop offset="1" stopColor="#172851" />
      </linearGradient>
      <linearGradient id={ids.facet} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a7c0f5" /><stop offset="1" stopColor="#4165b6" />
      </linearGradient>
      <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#dec78f" /><stop offset="1" stopColor="#9b7837" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="438" height="278" rx="18" fill={`url(#${ids.canvas})`} stroke="#dce3ed" />
    <path d="M19 1h402a18 18 0 0 1 18 18v38H1V19A18 18 0 0 1 19 1Z" fill={colours.white} />
    <path d="M1 57h438" stroke={colours.line} />
    <path d="m24 27 6-8h14l6 8-13 13Z" fill={`url(#${ids.gold})`} />
    <path d="m30 19 7 21 7-21M24 27h26" fill="none" stroke="#fff8e5" strokeWidth="0.7" />
    <Label x="62" y="28" size="10" weight="700" letterSpacing="1.4">PINNAWALA GEMS</Label>
    <Label x="62" y="42" size="8" fill={colours.muted} letterSpacing="1.1">ADMIN WORKSPACE</Label>
    <rect x="345" y="20" width="70" height="22" rx="11" fill={colours.goldPale} />
    <Label x="380" y="34" size="9" fill="#856a33" weight="700" letterSpacing="1" textAnchor="middle">GUIDE</Label>
    <Illustration ids={ids} />
    <Label x="24" y="262" size="8" fill={colours.muted} letterSpacing="1">ILLUSTRATION · NOT LIVE DATA</Label>
    <circle cx="399" cy="259" r="2" fill={colours.gold} />
    <circle cx="408" cy="259" r="2" fill="#c9d2e0" />
    <circle cx="417" cy="259" r="2" fill="#c9d2e0" />
  </svg>;
}
