const Footer = () => {
  return (
    <footer className="bg-transparent text-gray-700 p-4 text-center mt-6">
      <div className="max-w-3xl mx-auto text-sm text-center">
        <p className="font-semibold mb-1">櫻桃碎碎念</p>
        <p>
          公式參考了
          <a href="https://m.bilibili.com/opus/979579497904865287" target="_blank" rel="noopener noreferrer" className="text-cherry-600 hover:underline">折字愿为安</a>
          和
          <a href="https://b23.tv/C4Iq2IZ" target="_blank" rel="noopener noreferrer" className="text-cherry-600 hover:underline">进团先发秒伤</a>
          兩位老師的專欄。經過驗證適用於台服目前版本。考慮到很多人不太喜歡數學，所以才整合成計算器。本來還想加上對塔傷害部分，但因為我一個人難以驗證，結果還是放棄了。後續可能大概還會更新內功和周天，可能吧我也不知道。
        </p>
      </div>
    </footer>
  );
};