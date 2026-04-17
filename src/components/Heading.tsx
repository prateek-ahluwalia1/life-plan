import styles from "../css/Heading.module.css"; // Your separate CSS file

function Heading() {
  return (
    <header className={styles["landing-header"]}>
      <h1 className={styles["landing-logo"]}>
      
        Your LifePlan <span className={styles["broken-blue"]} style={{fontSize:"80px"}}> Jour</span>
            <span className={styles["broken-brown"]} style={{fontSize:"80px"}}>ney</span>
          </h1>

    </header>
  );
}

export default Heading;
