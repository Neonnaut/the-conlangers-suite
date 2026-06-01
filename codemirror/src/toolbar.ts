import { showPanel } from '@codemirror/view';

function toolbar_func(app:string) {
   const dom = document.createElement("div");
   dom.className = "cm-toolbar";

   const generate_btn = document.createElement("button");
   generate_btn.innerHTML = app === "vocabug" ?
      "<i class='fa fa-play'></i> Generate" : "<i class='fa fa-play'></i> Apply";
   generate_btn.classList.add("action-btn", "green-btn");
   dom.appendChild(generate_btn);

   const config_btn = document.createElement("button");
   config_btn.innerHTML = "<i class='fa fa-gear'></i> Config";
   config_btn.onclick = () => window.location.href = '#config';
   dom.appendChild(config_btn);

   const clear_btn = document.createElement("button");
   clear_btn.innerHTML = "<i class='fa fa-trash-can'></i> Clear editor";
   clear_btn.classList.add("clear-editor");
   dom.appendChild(clear_btn);

   return { dom, top: false };
}

export function toolbar(app:string) {
   return showPanel.of(() => toolbar_func(app));
}
